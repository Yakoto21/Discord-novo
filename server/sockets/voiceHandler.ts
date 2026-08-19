import { Server, Socket } from 'socket.io';
import { VoiceParticipant } from '../types';

// Map de salas de voz ativas: channelId -> Map<socketId, VoiceParticipant>
export const voiceRooms: Map<string, Map<string, VoiceParticipant>> = new Map();

// Helper para obter o snapshot atual de todas as salas de voz para a sidebar
export const getVoiceRoomsSummary = () => {
  const summary: Record<string, VoiceParticipant[]> = {};
  voiceRooms.forEach((participants, channelId) => {
    summary[channelId] = Array.from(participants.values());
  });
  return summary;
};

// Sanitização e validação de strings para evitar injeções
const sanitizeString = (str: any, maxLen = 100): string => {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLen).replace(/[<>]/g, '');
};

export const registerVoiceHandlers = (io: Server, socket: Socket) => {
  // Usuário solicita o status atual de todas as salas de voz
  socket.on('voice:get-rooms-status', () => {
    socket.emit('voice:rooms-status', getVoiceRoomsSummary());
  });

  // Entrar em uma sala de voz
  socket.on('voice:join', (data: { channelId: string; user: any; isMuted?: boolean; isVideoOn?: boolean }) => {
    if (!data || typeof data !== 'object') return;
    const { channelId, user, isMuted = false, isVideoOn = false } = data;

    if (!channelId || typeof channelId !== 'string' || !user || typeof user !== 'object') {
      return;
    }

    // Sanitiza dados do usuário
    const sanitizedUser = {
      id: sanitizeString(user.id, 64) || socket.id,
      username: sanitizeString(user.username, 32) || 'Usuário',
      avatarUrl: typeof user.avatarUrl === 'string' && user.avatarUrl.startsWith('http')
        ? user.avatarUrl
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    // Se já estava em outra sala, remove primeiro
    leaveAnyVoiceRoom(io, socket);

    if (!voiceRooms.has(channelId)) {
      voiceRooms.set(channelId, new Map());
    }

    const room = voiceRooms.get(channelId)!;
    const participant: VoiceParticipant = {
      socketId: socket.id,
      userId: sanitizedUser.id,
      username: sanitizedUser.username,
      avatarUrl: sanitizedUser.avatarUrl,
      isMuted: Boolean(isMuted),
      isDeafened: false,
      isVideoOn: Boolean(isVideoOn),
      isScreenSharing: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString()
    };

    const existingParticipants = Array.from(room.values());
    room.set(socket.id, participant);
    socket.join(`voice:${channelId}`);

    // 1. Envia ao novo usuário a lista dos participantes existentes
    socket.emit('voice:room-users', {
      channelId,
      participants: existingParticipants
    });

    // 2. Avisa aos demais participantes que um novo usuário entrou
    socket.to(`voice:${channelId}`).emit('voice:user-joined', {
      channelId,
      participant
    });

    // 3. Atualiza o status global para a sidebar
    io.emit('voice:rooms-status', getVoiceRoomsSummary());
  });

  // Sinalização WebRTC (Relay de Offer, Answer e ICE Candidates com validação)
  socket.on('voice:signal', (data: { targetSocketId: string; signal: any; channelId: string }) => {
    if (!data || typeof data !== 'object') return;
    const { targetSocketId, signal, channelId } = data;

    if (!targetSocketId || typeof targetSocketId !== 'string' || !signal || !channelId) {
      return;
    }

    // Previne envio de sinal para sockets que não estão no mesmo canal
    const room = voiceRooms.get(channelId);
    if (!room || !room.has(socket.id) || !room.has(targetSocketId)) {
      return;
    }

    io.to(targetSocketId).emit('voice:signal', {
      fromSocketId: socket.id,
      signal,
      channelId
    });
  });

  // Atualização de estado (Mudo, Surdo, Câmera, Compartilhamento de Tela, Falando)
  socket.on('voice:state-update', (data: { channelId: string; state: Partial<VoiceParticipant> }) => {
    if (!data || typeof data !== 'object' || !data.channelId || typeof data.channelId !== 'string') {
      return;
    }

    const { channelId, state } = data;
    const room = voiceRooms.get(channelId);
    if (!room) return;

    const participant = room.get(socket.id);
    if (!participant) return;

    // Atualiza apenas campos permitidos de estado
    if (typeof state.isMuted === 'boolean') participant.isMuted = state.isMuted;
    if (typeof state.isDeafened === 'boolean') participant.isDeafened = state.isDeafened;
    if (typeof state.isVideoOn === 'boolean') participant.isVideoOn = state.isVideoOn;
    if (typeof state.isScreenSharing === 'boolean') participant.isScreenSharing = state.isScreenSharing;
    if (typeof state.isSpeaking === 'boolean') participant.isSpeaking = state.isSpeaking;

    room.set(socket.id, participant);

    // Notifica os usuários da sala
    io.to(`voice:${channelId}`).emit('voice:state-changed', {
      channelId,
      socketId: socket.id,
      state
    });

    // Atualiza resumo global para a sidebar
    io.emit('voice:rooms-status', getVoiceRoomsSummary());
  });

  // Sair da sala de voz explicitamente
  socket.on('voice:leave', (data: { channelId?: string }) => {
    handleVoiceLeave(io, socket, data?.channelId);
  });
};

export const handleVoiceLeave = (io: Server, socket: Socket, channelId?: string) => {
  let targetChannelId = channelId;

  if (!targetChannelId) {
    voiceRooms.forEach((participants, cId) => {
      if (participants.has(socket.id)) {
        targetChannelId = cId;
      }
    });
  }

  if (targetChannelId && voiceRooms.has(targetChannelId)) {
    const room = voiceRooms.get(targetChannelId)!;
    if (room.has(socket.id)) {
      room.delete(socket.id);
      socket.leave(`voice:${targetChannelId}`);

      socket.to(`voice:${targetChannelId}`).emit('voice:user-left', {
        channelId: targetChannelId,
        socketId: socket.id
      });

      if (room.size === 0) {
        voiceRooms.delete(targetChannelId);
      }

      io.emit('voice:rooms-status', getVoiceRoomsSummary());
    }
  }
};

const leaveAnyVoiceRoom = (io: Server, socket: Socket) => {
  voiceRooms.forEach((participants, channelId) => {
    if (participants.has(socket.id)) {
      handleVoiceLeave(io, socket, channelId);
    }
  });
};
