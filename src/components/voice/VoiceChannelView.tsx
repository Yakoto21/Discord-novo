import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  PhoneOff,
  Signal,
  Radio,
  Sparkles,
  Maximize2,
  Minimize2,
  Users,
  Headphones,
  VolumeX,
  Cast,
  Tv,
  MonitorUp,
  PictureInPicture,
  Crop,
  Scaling,
  MousePointer,
  MousePointerClick,
  Activity,
  Terminal,
  Cpu,
} from 'lucide-react';
import { Channel, User, VoiceParticipant, WebRTCDiagnosticReport } from '../../types';
import { WebRTCDiagnosticsModal } from './WebRTCDiagnosticsModal';

interface VoiceChannelViewProps {
  channel: Channel;
  currentUser: User | null;
  participants: VoiceParticipant[];
  localStream: MediaStream | null;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  cursorMode?: 'always' | 'motion';
  isSpeakingLocally: boolean;
  mediaError: string | null;
  getDiagnostics?: () => WebRTCDiagnosticReport;
  onLogDiagnostics?: () => WebRTCDiagnosticReport;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleCursorMode?: () => void;
  onDisconnect: () => void;
}

// Sub-componente de Player de Vídeo Holográfico com suporte a Fill/Contain, Picture-in-Picture e auto-play garantido
const VideoPlayer: React.FC<{
  stream: MediaStream;
  isLocal?: boolean;
  isScreen?: boolean;
  fitMode?: 'cover' | 'contain';
  onToggleFit?: () => void;
  className?: string;
}> = ({ stream, isLocal, isScreen, fitMode = 'cover', onToggleFit, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch((err) => {
        console.log('Autoplay prevenido pelo navegador, aguardando interação:', err);
      });
    }
  }, [stream]);

  const handleTogglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Picture-in-Picture não suportado ou negado:', err);
    }
  };

  return (
    <div className="relative w-full h-full aspect-video flex items-center justify-center group/player overflow-hidden bg-black/90">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        onLoadedMetadata={() => {
          videoRef.current?.play().catch(() => {});
        }}
        className={`w-full h-full aspect-video transition-all duration-200 ${
          fitMode === 'contain' ? 'object-contain bg-black' : 'object-cover bg-[#030712]'
        } ${isLocal && !isScreen ? 'scale-x-[-1]' : ''} ${className || ''}`}
      />

      {/* Ações flutuantes no player */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/player:opacity-100 transition-all z-20">
        {/* Toggle Fill / Contain direto no stream local */}
        {isLocal && onToggleFit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFit();
            }}
            className="p-1.5 rounded-xl glass-dock text-slate-300 hover:text-cyan-300 hover:scale-105 transition-all cursor-pointer shadow-lg border border-white/10 flex items-center gap-1 text-[10px] font-bold px-2"
            title={`Modo de Enquadramento: ${
              fitMode === 'contain' ? 'Ajustar sem corte (Contain)' : 'Preencher tela (Fill)'
            } - Clique para alternar`}
          >
            {fitMode === 'contain' ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Contain</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Fill</span>
              </>
            )}
          </button>
        )}

        {/* Botão de Picture-in-Picture */}
        <button
          onClick={handleTogglePiP}
          className="p-1.5 rounded-xl glass-dock text-slate-300 hover:text-white hover:scale-105 transition-all cursor-pointer shadow-lg border border-white/10"
          title="Modo Picture-in-Picture (Janela Flutuante)"
        >
          <PictureInPicture className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const VoiceChannelView: React.FC<VoiceChannelViewProps> = ({
  channel,
  currentUser,
  participants,
  localStream,
  isMuted,
  isDeafened,
  isVideoOn,
  isScreenSharing,
  cursorMode = 'always',
  isSpeakingLocally,
  mediaError,
  getDiagnostics,
  onLogDiagnostics,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onToggleCursorMode,
  onDisconnect,
}) => {
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localVideoFit, setLocalVideoFit] = useState<'cover' | 'contain'>('cover');
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [quickLogNotification, setQuickLogNotification] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const handleQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLogDiagnostics) {
      onLogDiagnostics();
    } else if (getDiagnostics) {
      console.log('[WebRTC Diagnostics Snapshot]', getDiagnostics());
    }
    setQuickLogNotification(true);
    setTimeout(() => setQuickLogNotification(false), 2200);
  };

  const allUsers: Array<{
    id: string;
    socketId: string;
    username: string;
    avatarUrl: string;
    isLocal: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
    isSpeaking: boolean;
    stream?: MediaStream;
  }> = [];

  if (currentUser) {
    allUsers.push({
      id: currentUser.id,
      socketId: 'local',
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      isLocal: true,
      isMuted,
      isDeafened,
      isVideoOn,
      isScreenSharing,
      isSpeaking: isSpeakingLocally && !isMuted && !isDeafened,
      stream: localStream || undefined,
    });
  }

  participants.forEach((p) => {
    allUsers.push({
      id: p.userId || p.socketId,
      socketId: p.socketId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      isLocal: false,
      isMuted: p.isMuted,
      isDeafened: p.isDeafened,
      isVideoOn: p.isVideoOn,
      isScreenSharing: p.isScreenSharing,
      isSpeaking: p.isSpeaking && !p.isMuted && !p.isDeafened,
      stream: p.stream,
    });
  });

  const activeScreenSharer = allUsers.find((u) => u.isScreenSharing && u.stream);
  const spotlightUser = focusedUserId
    ? allUsers.find((u) => u.id === focusedUserId || u.socketId === focusedUserId)
    : activeScreenSharer || null;

  const hasAnyActiveVideo = allUsers.some((u) => (u.isVideoOn || u.isScreenSharing) && u.stream);

  const toggleFullscreen = () => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      stageContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Contagem de participantes com vídeo ou tela ativa
  const activeVideoCount = allUsers.filter((u) => (u.isVideoOn || u.isScreenSharing) && u.stream).length;

  // Ajuste dinâmico entre 1, 2 ou 4 colunas baseado em participantes ativos
  const getDynamicGridColumns = () => {
    // Se há 1 ou menos participantes ativos no total ou com vídeo
    if (activeVideoCount <= 1 && allUsers.length <= 1) {
      return 'grid-cols-1 max-w-4xl';
    }
    // Se há 2 ou 3 participantes com vídeo (ou total de 2 a 3)
    if ((activeVideoCount >= 2 && activeVideoCount <= 3) || (activeVideoCount === 0 && allUsers.length <= 3)) {
      return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    }
    // Se há 4 ou mais participantes com vídeo ativo (ou 4+ no total) -> 4 colunas
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl';
  };

  // Reordenação inteligente: transmissões de tela primeiro para priorização visual
  const prioritizedUsers = [...allUsers].sort((a, b) => {
    if (a.isScreenSharing && !b.isScreenSharing) return -1;
    if (!a.isScreenSharing && b.isScreenSharing) return 1;
    if (a.isVideoOn && !b.isVideoOn) return -1;
    if (!a.isVideoOn && b.isVideoOn) return 1;
    return 0;
  });

  // Determina a largura/span de cada tile com prioridade para screen sharing
  const getTileGridSpan = (userItem: (typeof allUsers)[0]) => {
    if (userItem.isScreenSharing) {
      if (allUsers.length === 2) {
        return 'col-span-1 sm:col-span-2';
      }
      if (allUsers.length >= 3) {
        return 'col-span-1 sm:col-span-2 lg:col-span-2 sm:row-span-2';
      }
      return 'col-span-1';
    }
    return 'col-span-1';
  };

  return (
    <div
      ref={stageContainerRef}
      id="voice-stage-view"
      className="flex-1 glass-panel rounded-2xl flex flex-col relative overflow-hidden select-none border border-white/10 shadow-xl h-full min-h-0 w-full"
    >
      {/* Luz ambiente de fundo no palco */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo do Palco Espacial (Header) */}
      <div
        id="voice-header"
        className="h-14 px-3 sm:px-6 flex items-center justify-between shrink-0 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl z-10 gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <Signal className="w-3.5 h-3.5 shrink-0" />
            <span className="tracking-wide uppercase text-[9px] sm:text-[11px] whitespace-nowrap">RTC Conectado</span>
          </div>

          <div className="w-[1px] h-4 bg-white/15 mx-1 hidden sm:block shrink-0" />

          <h2 className="text-sm sm:text-base md:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 truncate">
            {channel.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 overflow-x-auto scrollbar-none py-1">
          {/* Toggle Rápido de Enquadramento de Câmera Local (Fill vs Contain) */}
          {isVideoOn && (
            <button
              id="btn-header-toggle-fit"
              onClick={() => setLocalVideoFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm shrink-0 whitespace-nowrap ${
                localVideoFit === 'contain'
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'glass-dock text-slate-300 hover:text-white border-white/10 hover:border-white/25'
              }`}
              title={`Ajuste do enquadramento da sua câmera: ${
                localVideoFit === 'cover' ? 'Preencher (Fill / Cortar bordas)' : 'Ajustar (Contain / Sem corte)'
              }`}
            >
              {localVideoFit === 'contain' ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Enquadramento: Ajustar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Enquadramento: Preencher</span>
                </>
              )}
            </button>
          )}

          {/* Toggle Visibilidade do Cursor na Transmissão de Tela */}
          {onToggleCursorMode && (
            <button
              id="btn-header-toggle-cursor"
              onClick={onToggleCursorMode}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm shrink-0 whitespace-nowrap ${
                cursorMode === 'motion'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
              }`}
              title={`Modo do Cursor na Captura de Tela: ${
                cursorMode === 'always'
                  ? 'Cursor: Sempre Visível (cursor: always)'
                  : 'Cursor: Apenas em Movimento (cursor: motion)'
              } - Clique para alternar`}
            >
              {cursorMode === 'motion' ? (
                <>
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Cursor: Em Movimento</span>
                </>
              ) : (
                <>
                  <MousePointer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Cursor: Sempre Visível</span>
                </>
              )}
            </button>
          )}

          {/* Botão e Indicador de Diagnóstico WebRTC & Console */}
          <div className="flex items-center gap-1 glass-dock p-1 rounded-full border border-cyan-500/30 bg-slate-900/60 shrink-0">
            <button
              id="btn-header-webrtc-diagnostics"
              onClick={() => setShowDiagnosticsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all cursor-pointer border border-cyan-400/20"
              title="Abrir Painel de Diagnóstico WebRTC & Handshake"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">WebRTC Status</span>
            </button>
            <button
              id="btn-header-webrtc-quicklog"
              onClick={handleQuickLog}
              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-full transition-all cursor-pointer"
              title="Imprimir Snapshot de Diagnóstico no Console (F12)"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          {activeScreenSharer ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse shrink-0 whitespace-nowrap">
              <Cast className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Transmissão Ativa</span>
            </div>
          ) : (
            <button
              onClick={onToggleScreenShare}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)] shrink-0 whitespace-nowrap"
            >
              <MonitorUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Compartilhar Tela</span>
            </button>
          )}

          <div className="text-xs text-slate-300 flex items-center gap-1.5 glass-dock px-2.5 sm:px-3 py-1 rounded-full border border-white/10 shrink-0 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold">{allUsers.length}</span>
            <span className="text-slate-400 hidden sm:inline">tripulantes</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white glass-dock rounded-lg hover:scale-105 transition-all cursor-pointer shrink-0"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Alerta de erro ou permissão de mídia */}
      {mediaError && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">{mediaError}</span>
          </div>
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 text-amber-100 font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-sm"
          >
            Abrir em Nova Aba
          </button>
        </div>
      )}

      {/* ÁREA CENTRAL DO PALCO (Holo-Stage Canvas) */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-3 md:p-4 overflow-hidden min-h-0 min-w-0 relative z-10 w-full">
        {spotlightUser ? (
          /* MODO SPOTLIGHT / TEATRO ESPACIAL */
          <div className="flex-1 flex flex-col lg:flex-row gap-2.5 sm:gap-3 md:gap-4 min-h-0 min-w-0 w-full overflow-hidden">
            {/* Feixe de Vídeo / Tela Principal em Destaque */}
            <div className="flex-1 aspect-video bg-slate-950/90 rounded-2xl overflow-hidden relative border-2 border-cyan-500/30 shadow-2xl flex items-center justify-center min-h-0 min-w-0 group backdrop-blur-2xl h-full w-full max-h-full">
              {(spotlightUser.isVideoOn || spotlightUser.isScreenSharing) && spotlightUser.stream ? (
                <VideoPlayer
                  stream={spotlightUser.stream}
                  isLocal={spotlightUser.isLocal}
                  isScreen={spotlightUser.isScreenSharing}
                  fitMode={spotlightUser.isLocal ? localVideoFit : 'cover'}
                  onToggleFit={() => setLocalVideoFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 p-4">
                  <img
                    src={spotlightUser.avatarUrl}
                    alt={spotlightUser.username}
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xl transition-all duration-300 ${
                      spotlightUser.isSpeaking
                        ? 'ring-4 ring-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-105'
                        : 'ring-1 ring-white/20'
                    }`}
                  />
                  <span className="text-white font-extrabold text-lg sm:text-xl tracking-wide">{spotlightUser.username}</span>
                </div>
              )}

              {/* Badge Holográfico da Transmissão */}
              <div className="absolute top-3 left-3 flex items-center gap-2 glass-dock px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-white shadow-xl z-10">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  {spotlightUser.isScreenSharing
                    ? `Transmissão de ${spotlightUser.username}`
                    : `Feed de ${spotlightUser.username}`}
                </span>
                {spotlightUser.isScreenSharing && (
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                    AO VIVO
                  </span>
                )}
              </div>

              {/* Botão de Retorno ao Grid */}
              {focusedUserId && (
                <button
                  onClick={() => setFocusedUserId(null)}
                  className="absolute top-3 right-3 glass-dock hover:bg-white/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full border border-cyan-400/30 transition-all cursor-pointer shadow-lg z-10"
                >
                  Restaurar Grade
                </button>
              )}
            </div>

            {/* Carrossel / Tira dos Outros Membros */}
            <div className="w-full lg:w-60 xl:w-72 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 pb-1 lg:pb-0 scrollbar-thin min-h-0 max-h-28 sm:max-h-36 lg:max-h-full">
              {allUsers.map((user) => {
                const isSelected = spotlightUser.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => setFocusedUserId(user.id)}
                    className={`relative aspect-video bg-slate-900/70 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 shrink-0 w-36 sm:w-44 lg:w-full flex items-center justify-center group backdrop-blur-xl ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : user.isSpeaking
                        ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                        : 'border-white/10 hover:border-white/25 hover:scale-[1.01]'
                    }`}
                  >
                    {(user.isVideoOn || user.isScreenSharing) && user.stream ? (
                      <VideoPlayer
                        stream={user.stream}
                        isLocal={user.isLocal}
                        isScreen={user.isScreenSharing}
                        fitMode={user.isLocal ? localVideoFit : 'cover'}
                        onToggleFit={() => setLocalVideoFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
                      />
                    ) : (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover ${
                          user.isSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_10px_#10b981]' : 'ring-1 ring-white/10'
                        }`}
                      />
                    )}

                    {/* Badge do Participante */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 glass-dock px-2 py-0.5 rounded-lg flex items-center justify-between text-[10px] text-white font-bold border border-white/10">
                      <span className="truncate">{user.username}</span>
                      <div className="flex items-center gap-1">
                        {user.isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                        {user.isScreenSharing && (
                          <span className="bg-cyan-500 text-[8px] font-black px-1.5 py-0.2 rounded-full">LIVE</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MODO GRID ESPACIAL DINÂMICO */
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 w-full h-full overflow-hidden">
            {/* Banner Convidativo de Início de Transmissão de Tela caso ninguém esteja transmitindo */}
            {!hasAnyActiveVideo && (
              <div className="mb-2.5 p-3 rounded-2xl glass-dock border border-cyan-400/30 flex items-center justify-between gap-3 max-w-xl w-full shrink-0 shadow-lg animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow">
                    <MonitorUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                      Transmissão de Tela Real
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                      Compartilhe seu monitor, janela de código ou jogo em tempo real.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleScreenShare}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wide shrink-0 shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Transmitir</span>
                </button>
              </div>
            )}

            <div
              className={`w-full h-full min-h-0 grid gap-2.5 sm:gap-3.5 auto-rows-fr ${getDynamicGridColumns()}`}
            >
              {prioritizedUsers.map((user) => {
                const hasVideo = (user.isVideoOn || user.isScreenSharing) && user.stream;
                const tileSpanClass = getTileGridSpan(user);

                return (
                  <div
                    key={user.id}
                    id={`voice-tile-${user.id}`}
                    onClick={() => setFocusedUserId(user.id)}
                    className={`relative aspect-video bg-slate-900/70 rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-200 border-2 cursor-pointer group shadow-xl backdrop-blur-xl w-full h-full min-h-0 min-w-0 ${tileSpanClass} ${
                      user.isSpeaking
                        ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.005]'
                        : user.isScreenSharing
                        ? 'border-cyan-400/80 ring-2 ring-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                        : 'border-white/10 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                    }`}
                  >
                    {hasVideo ? (
                      <VideoPlayer
                        stream={user.stream!}
                        isLocal={user.isLocal}
                        isScreen={user.isScreenSharing}
                        fitMode={user.isLocal ? localVideoFit : 'cover'}
                        onToggleFit={() => setLocalVideoFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-3">
                        <div className="relative">
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl object-cover shadow-xl transition-all duration-200 ${
                              user.isSpeaking
                                ? 'scale-105 ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : 'ring-1 ring-white/15'
                            }`}
                          />
                          {user.isSpeaking && (
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full animate-bounce shadow-[0_0_10px_#10b981]">
                              <Radio className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Identificador Holográfico de Nome e Status */}
                    <div className="absolute bottom-2 left-2 right-2 glass-dock px-2.5 py-1 rounded-xl flex items-center justify-between text-xs font-bold text-white shadow-lg border border-white/15 max-w-[calc(100%-16px)]">
                      <span className="truncate">{user.username}</span>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                        {user.isMuted && (
                          <span className="bg-rose-500/30 text-rose-300 p-0.5 rounded-md border border-rose-500/40" title="Mutado">
                            <MicOff className="w-3 h-3" />
                          </span>
                        )}

                        {user.isDeafened && (
                          <span className="bg-rose-500/30 text-rose-300 p-0.5 rounded-md border border-rose-500/40" title="Silenciado">
                            <VolumeX className="w-3 h-3" />
                          </span>
                        )}

                        {user.isScreenSharing && (
                          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full tracking-wider shadow-[0_0_6px_rgba(6,182,212,0.5)]">
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DOCK FLUTUANTE DE CONTROLES HOLOGRÁFICOS (Floating Spatial Pill Dock) */}
      <div className="p-2 sm:p-3 flex items-center justify-center shrink-0 z-20 max-w-full overflow-hidden">
        <div
          id="voice-controls-bar"
          className="glass-dock rounded-full py-1.5 sm:py-2 px-3 sm:px-5 border border-white/15 shadow-2xl flex items-center gap-1.5 sm:gap-2.5 md:gap-3 backdrop-blur-3xl max-w-full overflow-x-auto scrollbar-none"
        >
          {/* Toggle Câmera */}
          <button
            id="btn-voice-toggle-video"
            onClick={onToggleVideo}
            className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 shrink-0 ${
              isVideoOn
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300/40'
                : 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.15] hover:text-white border border-white/5'
            }`}
            title={isVideoOn ? 'Desligar Câmera' : 'Ligar Câmera'}
          >
            {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />}
          </button>

          {/* Toggle Fill / Contain (Ajuste ou Preenchimento de Enquadramento do Vídeo do Usuário) */}
          {isVideoOn && (
            <button
              id="btn-voice-toggle-fit"
              onClick={() => setLocalVideoFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
              className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 border shrink-0 ${
                localVideoFit === 'contain'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.15] hover:text-white border-white/5'
              }`}
              title={`Modo de Enquadramento da Câmera: ${
                localVideoFit === 'cover' ? 'Preencher (Fill)' : 'Ajustar sem cortes (Contain)'
              } - Clique para alternar`}
            >
              {localVideoFit === 'contain' ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          )}

          {/* Toggle Transmissão de Tela Real Nativa */}
          <button
            id="btn-voice-toggle-screenshare"
            onClick={onToggleScreenShare}
            className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 shrink-0 ${
              isScreenSharing
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300/40 animate-pulse'
                : 'bg-white/[0.08] text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/5'
            }`}
            title={isScreenSharing ? 'Parar Compartilhamento de Tela' : 'Compartilhar Tela Real (Janela / Monitor / Guia)'}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Toggle Visibilidade do Cursor na Captura de Tela ('always' vs 'motion') */}
          {onToggleCursorMode && (
            <button
              id="btn-voice-toggle-cursor"
              onClick={onToggleCursorMode}
              className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 border shrink-0 ${
                cursorMode === 'motion'
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : isScreenSharing
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.15] hover:text-white border-white/5'
              }`}
              title={`Modo do Cursor na Captura de Tela: ${
                cursorMode === 'always'
                  ? 'Cursor: Sempre Visível (cursor: always)'
                  : 'Cursor: Apenas em Movimento (cursor: motion)'
              } - Clique para alternar`}
            >
              {cursorMode === 'motion' ? (
                <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
              )}
            </button>
          )}

          {/* Toggle Microfone */}
          <button
            id="btn-voice-toggle-mute"
            onClick={onToggleMute}
            className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 shrink-0 ${
              isMuted
                ? 'bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-300/40'
                : 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.15] hover:text-white border border-white/5'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Toggle Deafen */}
          <button
            id="btn-voice-toggle-deafen"
            onClick={onToggleDeafen}
            className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 shrink-0 ${
              isDeafened
                ? 'bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-300/40'
                : 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.15] hover:text-white border border-white/5'
            }`}
            title={isDeafened ? 'Desativar Silêncio Total' : 'Silenciar Tudo'}
          >
            {isDeafened ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Painel de Diagnóstico WebRTC & Console */}
          <button
            id="btn-voice-diagnostics"
            onClick={() => setShowDiagnosticsModal(true)}
            className="p-2 sm:p-3 rounded-full bg-white/[0.08] text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/5 transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 shrink-0"
            title="Diagnóstico WebRTC em Tempo Real (Handshake & Senders)"
          >
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </button>

          {/* Botão Desconectar */}
          <button
            id="btn-voice-disconnect"
            onClick={onDisconnect}
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 border border-rose-300/30 shrink-0"
            title="Encerrar Conexão de Voz"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Desconectar</span>
          </button>
        </div>
      </div>

      {/* Notificação flutuante de Log no Console */}
      {quickLogNotification && (
        <div className="fixed bottom-24 right-6 z-50 bg-slate-900/95 border border-cyan-500/40 text-cyan-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in text-xs font-semibold">
          <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Snapshot WebRTC impresso no DevTools Console (F12)!</span>
        </div>
      )}

      {/* Modal de Diagnóstico em Tempo Real */}
      <WebRTCDiagnosticsModal
        isOpen={showDiagnosticsModal}
        onClose={() => setShowDiagnosticsModal(false)}
        getDiagnostics={getDiagnostics}
        onLogDiagnostics={onLogDiagnostics}
      />
    </div>
  );
};
