import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { User, VoiceParticipant, WebRTCDiagnosticReport, PeerDiagnosticInfo } from '../types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface UseWebRTCOptions {
  currentUser: User | null;
  activeVoiceChannelId: string | null;
  onLeaveVoice?: () => void;
}

export const useWebRTC = ({ currentUser, activeVoiceChannelId }: UseWebRTCOptions) => {
  const [participants, setParticipants] = useState<Map<string, VoiceParticipant>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cursorMode, setCursorMode] = useState<'always' | 'motion'>('always');
  const [isSpeakingLocally, setIsSpeakingLocally] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Referências para streams e conexões WebRTC
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Helper para parar todas as faixas de um MediaStream
  const stopAllTracks = (stream: MediaStream | null) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {
          // Ignora erros ao parar faixa já finalizada
        }
      });
    } catch (err) {
      console.warn('Erro ao interromper track de mídia:', err);
    }
  };

  // Helper para criar stream de áudio virtual caso o dispositivo não tenha microfone ou permissão
  const createMockAudioStream = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001; // Quase inaudível / sinal sentinela para WebRTC
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      if (track) track.enabled = !isMuted;
      return dst.stream;
    } catch {
      return new MediaStream();
    }
  }, [isMuted]);

  // Atualiza as faixas nos RTCPeerConnections existentes via replaceTrack ou addTrack
  const updatePeerSenders = useCallback((stream: MediaStream) => {
    peerConnections.current.forEach((pc, peerSocketId) => {
      const senders = pc.getSenders();
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      console.log(`[WebRTC] 🔄 updatePeerSenders for peer ${peerSocketId}. Active senders:`, senders.length, {
        audioTracksCount: audioTracks.length,
        videoTracksCount: videoTracks.length,
      });

      // 1. Processa faixas de áudio
      audioTracks.forEach((track) => {
        const audioSender = senders.find((s) => s.track?.kind === 'audio');
        if (audioSender) {
          console.log(`[WebRTC] 🔁 replaceTrack (audio) for peer ${peerSocketId}:`, track.id);
          audioSender.replaceTrack(track).catch((err) => {
            console.warn(`[WebRTC] replaceTrack (audio) failed for ${peerSocketId}:`, err);
          });
        } else {
          try {
            console.log(`[WebRTC] ➕ addTrack (audio) to peer ${peerSocketId}:`, track.id);
            pc.addTrack(track, stream);
          } catch (e) {
            console.warn(`[WebRTC] Error in addTrack (audio) for ${peerSocketId}:`, e);
          }
        }
      });

      // 2. Processa faixas de vídeo (Câmera ou Compartilhamento de Tela)
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          console.log(`[WebRTC] 🔁 replaceTrack (video/screenshare) for peer ${peerSocketId}:`, videoTrack.id);
          videoSender.replaceTrack(videoTrack).catch((err) => {
            console.warn(`[WebRTC] replaceTrack (video) failed for ${peerSocketId}, triggering renegotiation:`, err);
            if (activeVoiceChannelId) {
              sendOffer(peerSocketId, activeVoiceChannelId);
            }
          });
        } else {
          try {
            console.log(`[WebRTC] ➕ addTrack (video/screenshare) to peer ${peerSocketId}:`, videoTrack.id);
            pc.addTrack(videoTrack, stream);
            // addTrack irá disparar o evento negotiationneeded no RTCPeerConnection
          } catch (e) {
            console.warn(`[WebRTC] Error in addTrack (video) for ${peerSocketId}:`, e);
          }
        }
      } else {
        // Se não há mais faixas de vídeo (tela ou câmera desativadas), limpa o track no sender
        senders.forEach((s) => {
          if (s.track?.kind === 'video') {
            console.log(`[WebRTC] ⏹️ Nulling video track on sender for peer ${peerSocketId}`);
            s.replaceTrack(null).catch((e) => {
              console.warn(`[WebRTC] Error resetting video sender to null for ${peerSocketId}:`, e);
            });
          }
        });
      }
    });
  }, [activeVoiceChannelId]);

  // Inicializa a mídia local (Microfone e Opcionalmente Câmera)
  const initLocalMedia = useCallback(async (enableVideo = false) => {
    try {
      if (!screenStreamRef.current && localStreamRef.current) {
        stopAllTracks(localStreamRef.current);
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: enableVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
      } catch (err: any) {
        console.warn('⚠️ Dispositivo de áudio/vídeo padrão restrito, utilizando stream de áudio alternativa:', err.message);
        stream = createMockAudioStream();
      }

      cameraStreamRef.current = stream;
      localStreamRef.current = stream;
      setLocalStream(new MediaStream(stream.getTracks()));

      // Inicia analisador de volume de voz
      setupAudioAnalyser(stream);

      // Atualiza senders nas conexões WebRTC ativas
      updatePeerSenders(stream);

      return stream;
    } catch (err: any) {
      console.error('Erro ao inicializar mídia local:', err);
      return null;
    }
  }, [createMockAudioStream, updatePeerSenders]);

  // Analisador de volume para detecção de fala (Voice Activity Detection)
  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let speakingCounter = 0;

      const checkAudioLevel = () => {
        if (!analyserRef.current || isMuted || isDeafened) {
          setIsSpeakingLocally(false);
          animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        const isSpeaking = average > 14;
        if (isSpeaking) {
          speakingCounter = 6;
          setIsSpeakingLocally(true);
        } else {
          if (speakingCounter > 0) {
            speakingCounter--;
          } else {
            setIsSpeakingLocally(false);
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (e) {
      console.warn('AudioAnalyser indisponível:', e);
    }
  };

  // Cria uma conexão RTCPeerConnection para um peer remoto
  const createPeerConnection = useCallback((peerSocketId: string, channelId: string) => {
    if (peerConnections.current.has(peerSocketId)) {
      return peerConnections.current.get(peerSocketId)!;
    }

    console.log(`[WebRTC] 🛠️ Creating new RTCPeerConnection for peer: ${peerSocketId} in channel: ${channelId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const socket = getSocket();

    // 1. Adiciona tracks locais ao RTCPeerConnection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          console.log(`[WebRTC] ➕ [addTrack] Adding local track (${track.kind}: ${track.id}) to peer ${peerSocketId}`);
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn(`[WebRTC] ⚠️ Error in addTrack for peer ${peerSocketId}:`, e);
        }
      });
    }

    // 2. Manipulador de renegotiationneeded para renegociação automática
    pc.onnegotiationneeded = async () => {
      console.log(`[WebRTC] ⚡ [negotiationneeded] Event triggered for peer: ${peerSocketId} (signalingState: ${pc.signalingState})`);
      try {
        if (pc.signalingState !== 'stable') {
          console.log(`[WebRTC] ⏸️ [negotiationneeded] Skipping offer creation because signalingState is ${pc.signalingState}`);
          return;
        }
        await sendOffer(peerSocketId, channelId);
      } catch (err) {
        console.error(`[WebRTC] ❌ [negotiationneeded] Error during offer renegotiation for ${peerSocketId}:`, err);
      }
    };

    // 3. ICE Candidate gathering
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC] ❄️ Generated ICE candidate for ${peerSocketId}:`, event.candidate.candidate?.slice(0, 45) + '...');
        socket.emit('voice:signal', {
          targetSocketId: peerSocketId,
          channelId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    // 4. Conexão e estados de sinalização
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] 🌐 ConnectionState changed for ${peerSocketId}: ${pc.connectionState}`);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] 🧊 ICEConnectionState changed for ${peerSocketId}: ${pc.iceConnectionState}`);
    };

    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] 📶 SignalingState changed for ${peerSocketId}: ${pc.signalingState}`);
    };

    // 5. Recepção de faixas de mídia remotas (Câmera, Compartilhamento de Tela, Áudio)
    pc.ontrack = (event) => {
      console.log(`[WebRTC] 📥 [ontrack] Track received from peer ${peerSocketId}:`, {
        kind: event.track.kind,
        id: event.track.id,
        streamId: event.streams[0]?.id || 'standalone',
        readyState: event.track.readyState,
        enabled: event.track.enabled,
      });

      let stream = remoteStreams.current.get(peerSocketId);
      if (!stream) {
        stream = new MediaStream();
        remoteStreams.current.set(peerSocketId, stream);
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!stream!.getTracks().some((t) => t.id === track.id)) {
            console.log(`[WebRTC] ➕ [ontrack] Binding stream track (${track.kind}: ${track.id}) to peer ${peerSocketId}`);
            stream!.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!stream.getTracks().some((t) => t.id === event.track.id)) {
          console.log(`[WebRTC] ➕ [ontrack] Binding direct track (${event.track.kind}: ${event.track.id}) to peer ${peerSocketId}`);
          stream.addTrack(event.track);
        }
      }

      event.track.onended = () => {
        console.log(`[WebRTC] ⏹️ Remote track ended for ${peerSocketId} (${event.track.kind}: ${event.track.id})`);
        setParticipants((prev) => {
          const next = new Map(prev);
          const existing = prev.get(peerSocketId);
          if (existing && stream) {
            next.set(peerSocketId, {
              ...existing,
              stream: new MediaStream(stream.getTracks().filter((t) => t.readyState === 'live')),
            });
          }
          return next;
        });
      };

      const updatedStream = new MediaStream(stream.getTracks());
      setParticipants((prev) => {
        const next = new Map(prev);
        const existing = prev.get(peerSocketId);
        if (existing) {
          console.log(`[WebRTC] ✅ Updated participants state for ${peerSocketId} with active stream (${updatedStream.getTracks().length} tracks)`);
          next.set(peerSocketId, { ...existing, stream: updatedStream });
        } else {
          console.log(`[WebRTC] ⏳ Stored stream for ${peerSocketId}, awaiting user metadata`);
        }
        return next;
      });
    };

    peerConnections.current.set(peerSocketId, pc);
    return pc;
  }, []);

  // Envia oferta WebRTC (SDP Offer)
  const sendOffer = useCallback(async (peerSocketId: string, channelId: string) => {
    const socket = getSocket();
    const pc = createPeerConnection(peerSocketId, channelId);

    try {
      console.log(`[WebRTC] 📤 [sendOffer] Creating offer for peer ${peerSocketId} (channel: ${channelId})`);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log(`[WebRTC] 📤 [sendOffer] Local description set. Emitting voice:signal (offer) to ${peerSocketId}`);

      socket.emit('voice:signal', {
        targetSocketId: peerSocketId,
        channelId,
        signal: {
          type: 'offer',
          sdp: offer,
        },
      });
    } catch (err) {
      console.error(`[WebRTC] ❌ [sendOffer] Error creating WebRTC offer for ${peerSocketId}:`, err);
    }
  }, [createPeerConnection]);

  // Responde oferta WebRTC (SDP Answer)
  const handleReceiveOffer = useCallback(async (fromSocketId: string, sdp: RTCSessionDescriptionInit, channelId: string) => {
    const socket = getSocket();
    const pc = createPeerConnection(fromSocketId, channelId);

    try {
      console.log(`[WebRTC] 📥 [handleReceiveOffer] Received offer from ${fromSocketId}. Current signalingState: ${pc.signalingState}`);
      if (pc.signalingState === 'have-local-offer') {
        console.log(`[WebRTC] 🔄 Resolving glare condition with rollback for ${fromSocketId}`);
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log(`[WebRTC] 📥 [handleReceiveOffer] Remote description set. Creating answer for ${fromSocketId}`);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`[WebRTC] 📤 [handleReceiveOffer] Local description (answer) set. Emitting voice:signal (answer) to ${fromSocketId}`);

      socket.emit('voice:signal', {
        targetSocketId: fromSocketId,
        channelId,
        signal: {
          type: 'answer',
          sdp: answer,
        },
      });
    } catch (err) {
      console.error(`[WebRTC] ❌ [handleReceiveOffer] Error responding to offer from ${fromSocketId}:`, err);
    }
  }, [createPeerConnection]);

  // Recebe resposta WebRTC (SDP Answer)
  const handleReceiveAnswer = useCallback(async (fromSocketId: string, sdp: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(fromSocketId);
    if (pc) {
      console.log(`[WebRTC] 📥 [handleReceiveAnswer] Received answer from ${fromSocketId}. signalingState: ${pc.signalingState}`);
      if (pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log(`[WebRTC] ✅ [handleReceiveAnswer] Remote description (answer) set successfully for ${fromSocketId}`);
        } catch (err) {
          console.error(`[WebRTC] ❌ [handleReceiveAnswer] Error setting remote description from ${fromSocketId}:`, err);
        }
      }
    }
  }, []);

  // Recebe candidato ICE
  const handleReceiveCandidate = useCallback(async (fromSocketId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(fromSocketId);
    if (pc) {
      try {
        console.log(`[WebRTC] 📥 [handleReceiveCandidate] Adding ICE candidate from ${fromSocketId}`);
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`[WebRTC] ❌ Error adding ICE candidate from ${fromSocketId}:`, err);
      }
    }
  }, []);

  // Efeito principal de conexão e sinalização na sala de voz
  useEffect(() => {
    if (!activeVoiceChannelId || !currentUser) {
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      remoteStreams.current.clear();
      setParticipants(new Map());

      stopAllTracks(localStreamRef.current);
      stopAllTracks(screenStreamRef.current);
      stopAllTracks(cameraStreamRef.current);
      localStreamRef.current = null;
      screenStreamRef.current = null;
      cameraStreamRef.current = null;
      setLocalStream(null);
      setIsScreenSharing(false);
      setIsVideoOn(false);

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const socket = getSocket();

    initLocalMedia(isVideoOn).then(() => {
      socket.emit('voice:join', {
        channelId: activeVoiceChannelId,
        user: currentUser,
        isMuted,
        isVideoOn,
      });
    });

    const handleRoomUsers = (data: { channelId: string; participants: VoiceParticipant[] }) => {
      if (data.channelId !== activeVoiceChannelId) return;

      console.log(`[WebRTC] 👥 [handleRoomUsers] Received ${data.participants.length} participants in channel:`, data.channelId);
      const pMap = new Map<string, VoiceParticipant>();
      data.participants.forEach((p) => {
        if (p.socketId !== socket.id) {
          const stream = remoteStreams.current.get(p.socketId);
          pMap.set(p.socketId, {
            ...p,
            stream: stream ? new MediaStream(stream.getTracks()) : undefined,
          });
          console.log(`[WebRTC] 📞 [handleRoomUsers] Initiating call/offer to existing participant: ${p.username} (${p.socketId})`);
          sendOffer(p.socketId, activeVoiceChannelId);
        }
      });
      setParticipants(pMap);
    };

    const handleUserJoined = (data: { channelId: string; participant: VoiceParticipant }) => {
      if (data.channelId !== activeVoiceChannelId) return;
      if (data.participant.socketId === socket.id) return;

      console.log(`[WebRTC] 👤 [handleUserJoined] Participant joined: ${data.participant.username} (${data.participant.socketId})`);
      const stream = remoteStreams.current.get(data.participant.socketId);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(data.participant.socketId, {
          ...data.participant,
          stream: stream ? new MediaStream(stream.getTracks()) : undefined,
        });
        return next;
      });
    };

    const handleVoiceSignal = (data: { fromSocketId: string; signal: any; channelId: string }) => {
      const { fromSocketId, signal, channelId } = data;

      if (signal.type === 'offer') {
        handleReceiveOffer(fromSocketId, signal.sdp, channelId);
      } else if (signal.type === 'answer') {
        handleReceiveAnswer(fromSocketId, signal.sdp);
      } else if (signal.type === 'ice-candidate') {
        handleReceiveCandidate(fromSocketId, signal.candidate);
      }
    };

    const handleStateChanged = (data: { channelId: string; socketId: string; state: Partial<VoiceParticipant> }) => {
      if (data.channelId !== activeVoiceChannelId) return;

      console.log(`[WebRTC] 📡 [handleStateChanged] State updated for ${data.socketId}:`, data.state);
      setParticipants((prev) => {
        const next = new Map(prev);
        const existing = prev.get(data.socketId);
        const stream = remoteStreams.current.get(data.socketId);
        if (existing) {
          next.set(data.socketId, {
            ...existing,
            ...data.state,
            stream: existing.stream || (stream ? new MediaStream(stream.getTracks()) : undefined),
          });
        }
        return next;
      });
    };

    const handleUserLeft = (data: { channelId: string; socketId: string }) => {
      if (data.channelId !== activeVoiceChannelId) return;

      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      remoteStreams.current.delete(data.socketId);

      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    };

    socket.on('voice:room-users', handleRoomUsers);
    socket.on('voice:user-joined', handleUserJoined);
    socket.on('voice:signal', handleVoiceSignal);
    socket.on('voice:state-changed', handleStateChanged);
    socket.on('voice:user-left', handleUserLeft);

    return () => {
      socket.off('voice:room-users', handleRoomUsers);
      socket.off('voice:user-joined', handleUserJoined);
      socket.off('voice:signal', handleVoiceSignal);
      socket.off('voice:state-changed', handleStateChanged);
      socket.off('voice:user-left', handleUserLeft);
    };
  }, [
    activeVoiceChannelId,
    currentUser,
    initLocalMedia,
    isVideoOn,
    isMuted,
    sendOffer,
    handleReceiveOffer,
    handleReceiveAnswer,
    handleReceiveCandidate,
  ]);

  // Notifica o estado de fala ativo
  useEffect(() => {
    if (!activeVoiceChannelId) return;
    const socket = getSocket();
    socket.emit('voice:state-update', {
      channelId: activeVoiceChannelId,
      state: { isSpeaking: isSpeakingLocally && !isMuted && !isDeafened },
    });
  }, [isSpeakingLocally, isMuted, isDeafened, activeVoiceChannelId]);

  // Toggle Microfone
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }

    if (activeVoiceChannelId) {
      getSocket().emit('voice:state-update', {
        channelId: activeVoiceChannelId,
        state: { isMuted: newMuted },
      });
    }
  };

  // Toggle Áudio/Headset (Deafen)
  const toggleDeafen = () => {
    const newDeaf = !isDeafened;
    setIsDeafened(newDeaf);

    if (newDeaf && !isMuted) {
      toggleMute();
    }

    if (activeVoiceChannelId) {
      getSocket().emit('voice:state-update', {
        channelId: activeVoiceChannelId,
        state: { isDeafened: newDeaf },
      });
    }
  };

  // Toggle Câmera / Vídeo
  const toggleVideo = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    }

    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    await initLocalMedia(newVideoState);

    if (activeVoiceChannelId) {
      getSocket().emit('voice:state-update', {
        channelId: activeVoiceChannelId,
        state: { isVideoOn: newVideoState, isScreenSharing: false },
      });
    }
  };

  // Encerra compartilhamento de tela com segurança
  const stopScreenShare = () => {
    console.log('[WebRTC] ⏹️ Stopping screen share session');
    stopAllTracks(screenStreamRef.current);
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    // Restaura o stream padrão de áudio/vídeo
    initLocalMedia(isVideoOn);

    if (activeVoiceChannelId) {
      console.log(`[WebRTC] 📡 Emitting voice:state-update { isScreenSharing: false } for channel ${activeVoiceChannelId}`);
      getSocket().emit('voice:state-update', {
        channelId: activeVoiceChannelId,
        state: { isScreenSharing: false },
      });
    }
  };

  // Alterna ou define visibilidade do cursor na captura de tela (always vs motion)
  const toggleCursorMode = useCallback(async () => {
    const nextMode = cursorMode === 'always' ? 'motion' : 'always';
    setCursorMode(nextMode);

    if (isScreenSharing && screenStreamRef.current) {
      const videoTrack = screenStreamRef.current.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        try {
          await videoTrack.applyConstraints({
            cursor: nextMode,
          } as any);
        } catch (e) {
          console.log('Navegador requer reinicialização da tela para alterar cursor:', e);
        }
      }
    }
  }, [cursorMode, isScreenSharing]);

  const setCursorOption = useCallback(async (mode: 'always' | 'motion') => {
    setCursorMode(mode);

    if (isScreenSharing && screenStreamRef.current) {
      const videoTrack = screenStreamRef.current.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        try {
          await videoTrack.applyConstraints({
            cursor: mode,
          } as any);
        } catch (e) {
          console.log('applyConstraints cursor não suportado dinamicamente:', e);
        }
      }
    }
  }, [isScreenSharing]);

  /**
   * Transmissão de Tela Real Nativa com navigator.mediaDevices.getDisplayMedia
   * Abre o diálogo nativo do sistema para escolha de Telas Inteiras, Janelas ou Guias.
   * Suporta configuração de visibilidade de cursor ('always' ou 'motion').
   */
  const toggleScreenShare = async (forcedCursorMode?: 'always' | 'motion') => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    const activeCursor = forcedCursorMode || cursorMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setMediaError('Seu navegador atual não suporta a API de captura de tela nativa (getDisplayMedia).');
        return;
      }

      // Chama getDisplayMedia imediatamente no primeiro tick para garantir ativação do clique de usuário (User Gesture)
      const constraints: DisplayMediaStreamOptions = {
        video: {
          cursor: (activeCursor === 'motion' ? 'motion' : 'always') as any,
          frameRate: { max: 60 },
        } as any,
      };

      console.log(`[WebRTC] 🖥️ Screen capture requested with cursor: ${activeCursor}. Calling getDisplayMedia...`);
      const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // State check: valida se o display media stream retornou tracks válidos e ativos
      const videoTrack = screenStream.getVideoTracks()[0];
      const isDisplayMediaActive = Boolean(
        screenStream &&
        videoTrack &&
        videoTrack.readyState === 'live' &&
        videoTrack.enabled
      );

      if (!isDisplayMediaActive || !videoTrack) {
        console.warn('[WebRTC] ⚠️ Display media stream is not active or video track is missing.');
        setMediaError('Não foi possível obter uma faixa de vídeo válida para compartilhamento de tela.');
        stopAllTracks(screenStream);
        return;
      }

      console.log(`[WebRTC] 📺 Obtained screen video track: ${videoTrack.id} (${videoTrack.label || 'Screen'})`, {
        readyState: videoTrack.readyState,
        enabled: videoTrack.enabled,
        settings: videoTrack.getSettings ? videoTrack.getSettings() : {},
      });

      // Handler quando o usuário encerra o compartilhamento pelo botão nativo do sistema/navegador
      videoTrack.onended = () => {
        console.log('[WebRTC] ⏹️ Screen sharing track ended natively by browser/system UI');
        stopScreenShare();
      };

      screenStreamRef.current = screenStream;

      // Preserva o microfone do usuário junto à transmissão de tela
      const audioTrack = localStreamRef.current?.getAudioTracks()[0] || screenStream.getAudioTracks()[0];

      const combinedStream = new MediaStream();
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }
      combinedStream.addTrack(videoTrack);

      localStreamRef.current = combinedStream;
      setLocalStream(new MediaStream(combinedStream.getTracks()));

      // Itera explicitamente sobre todas as conexões RTCPeerConnection e seus senders
      console.log(`[WebRTC] 🚀 Iterating over ${peerConnections.current.size} RTCPeerConnection(s) to replace/add screen video track...`);
      peerConnections.current.forEach((pc, peerSocketId) => {
        try {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');

          if (videoSender) {
            console.log(`[WebRTC] 🔁 [toggleScreenShare] Replacing existing video track on sender for peer ${peerSocketId} with screen track ${videoTrack.id}`);
            videoSender.replaceTrack(videoTrack).catch((err) => {
              console.warn(`[WebRTC] ⚠️ replaceTrack failed for peer ${peerSocketId}, triggering offer renegotiation:`, err);
              if (activeVoiceChannelId) {
                sendOffer(peerSocketId, activeVoiceChannelId);
              }
            });
          } else {
            console.log(`[WebRTC] ➕ [toggleScreenShare] No video sender found. Adding new video track to peer ${peerSocketId}:`, videoTrack.id);
            try {
              pc.addTrack(videoTrack, combinedStream);
            } catch (addTrackErr) {
              console.warn(`[WebRTC] ⚠️ addTrack failed for peer ${peerSocketId}:`, addTrackErr);
            }
          }

          // Garante também a integridade do áudio no sender
          if (audioTrack) {
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(audioTrack).catch((err) => {
                console.warn(`[WebRTC] replaceTrack (audio) failed for ${peerSocketId}:`, err);
              });
            } else {
              try {
                pc.addTrack(audioTrack, combinedStream);
              } catch (audioAddErr) {
                console.warn(`[WebRTC] addTrack (audio) failed for ${peerSocketId}:`, audioAddErr);
              }
            }
          }
        } catch (peerErr) {
          console.error(`[WebRTC] ❌ Error configuring senders for peer ${peerSocketId}:`, peerErr);
        }
      });

      setIsScreenSharing(true);
      setMediaError(null);

      // State check antes de emitir a atualização de sinalização Socket.IO
      if (activeVoiceChannelId && screenStreamRef.current && screenStreamRef.current.getVideoTracks().length > 0) {
        console.log(`[WebRTC] 📡 Emitting verified voice:state-update { isScreenSharing: true, isVideoOn: false } for channel ${activeVoiceChannelId}`);
        getSocket().emit('voice:state-update', {
          channelId: activeVoiceChannelId,
          state: {
            isScreenSharing: true,
            isVideoOn: false,
          },
        });
      } else {
        console.warn('[WebRTC] ⚠️ State check failed for socket signaling: display media stream or activeVoiceChannelId missing.');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        if (err.message && (err.message.includes('permission') || err.message.includes('display-capture'))) {
          setMediaError('Permissão de captura de tela bloqueada no iframe. Clique no ícone de "Abrir em nova aba" no topo para transmitir.');
        } else {
          console.log('Captura de tela cancelada ou recusada.');
        }
      } else {
        console.error('Falha ao iniciar compartilhamento de tela:', err);
        setMediaError(`Erro ao iniciar compartilhamento de tela: ${err.message || err.name}`);
      }
    }
  };

  // Utilitário de diagnóstico WebRTC para inspecionar RTCPeerConnections em tempo real
  const getWebRTCDiagnostics = useCallback((): WebRTCDiagnosticReport => {
    const peers: PeerDiagnosticInfo[] = [];

    peerConnections.current.forEach((pc, socketId) => {
      const senders = pc.getSenders().map((s) => ({
        kind: s.track?.kind || 'none',
        id: s.track?.id,
        enabled: s.track?.enabled,
        readyState: s.track?.readyState,
      }));

      const receivers = pc.getReceivers().map((r) => ({
        kind: r.track?.kind || 'none',
        id: r.track?.id,
        enabled: r.track?.enabled,
        readyState: r.track?.readyState,
      }));

      peers.push({
        socketId,
        signalingState: pc.signalingState,
        iceConnectionState: pc.iceConnectionState,
        connectionState: pc.connectionState,
        iceGatheringState: pc.iceGatheringState,
        sendersCount: senders.length,
        senders,
        receiversCount: receivers.length,
        receivers,
      });
    });

    const localTracks = localStreamRef.current ? localStreamRef.current.getTracks() : [];
    const screenTracks = screenStreamRef.current ? screenStreamRef.current.getTracks() : [];

    return {
      timestamp: new Date().toISOString(),
      activeVoiceChannelId,
      peerCount: peers.length,
      peers,
      local: {
        hasStream: Boolean(localStreamRef.current),
        audioTracks: localTracks.filter((t) => t.kind === 'audio').length,
        videoTracks: localTracks.filter((t) => t.kind === 'video').length,
        tracks: localTracks.map((t) => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
        })),
      },
      screenShare: {
        isScreenSharing,
        hasScreenStream: Boolean(screenStreamRef.current),
        tracksCount: screenTracks.length,
        tracks: screenTracks.map((t) => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
        })),
      },
      state: {
        isMuted,
        isDeafened,
        isVideoOn,
        isSpeakingLocally,
        participantsCount: participants.size,
      },
    };
  }, [activeVoiceChannelId, isScreenSharing, isMuted, isDeafened, isVideoOn, isSpeakingLocally, participants.size]);

  // Imprime relatório no console do navegador e retorna o snapshot
  const logWebRTCDiagnostics = useCallback((): WebRTCDiagnosticReport => {
    const report = getWebRTCDiagnostics();
    console.group(`%c[WebRTC Diagnostics] 🔍 Handshake & Peer Status (${new Date().toLocaleTimeString()})`, 'color: #06b6d4; font-weight: bold; font-size: 13px;');
    console.log('📡 Voice Channel:', report.activeVoiceChannelId || 'Disconnected');
    console.log('👥 Active Peers Count:', report.peerCount);
    if (report.peers.length > 0) {
      console.table(
        report.peers.map((p) => ({
          'Peer ID': p.socketId,
          'Signaling State': p.signalingState,
          'ICE State': p.iceConnectionState,
          'Conn State': p.connectionState,
          'Senders': p.sendersCount,
          'Receivers': p.receiversCount,
        }))
      );
      report.peers.forEach((p, idx) => {
        console.groupCollapsed(`Peer #${idx + 1} (${p.socketId}) Details`);
        console.log('Senders:', p.senders);
        console.log('Receivers:', p.receivers);
        console.groupEnd();
      });
    } else {
      console.log('ℹ️ No remote peer connections currently open.');
    }
    console.log('🎙️ Local Media Stream:', report.local);
    console.log('🖥️ Screen Share State:', report.screenShare);
    console.log('🎛️ Audio/Video Controls:', report.state);
    console.groupEnd();

    return report;
  }, [getWebRTCDiagnostics]);

  // Desconectar da sala de voz
  const disconnectVoice = () => {
    if (activeVoiceChannelId) {
      getSocket().emit('voice:leave', { channelId: activeVoiceChannelId });
    }
  };

  return {
    participants: Array.from(participants.values()),
    localStream,
    isMuted,
    isDeafened,
    isVideoOn,
    isScreenSharing,
    cursorMode,
    isSpeakingLocally,
    mediaError,
    getDiagnostics: getWebRTCDiagnostics,
    logDiagnostics: logWebRTCDiagnostics,
    setCursorMode: setCursorOption,
    toggleCursorMode,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    disconnectVoice,
  };
};
