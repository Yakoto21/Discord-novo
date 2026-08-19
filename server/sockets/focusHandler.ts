import { Server as SocketIOServer, Socket } from 'socket.io';
import { FocusSessionState, FocusMode, FocusParticipant } from '../types';

const FOCUS_DURATIONS: Record<FocusMode, number> = {
  work: 25 * 60, // 25 minutos
  short_break: 5 * 60, // 5 minutos
  long_break: 15 * 60, // 15 minutos
};

// Armazenamento em memória das sessões ativas de foco por ID de canal
const focusRooms: Map<string, FocusSessionState> = new Map();

// Helper para obter ou inicializar o estado da sala de foco
const getOrCreateFocusRoom = (channelId: string): FocusSessionState => {
  let room = focusRooms.get(channelId);
  if (!room) {
    room = {
      channelId,
      mode: 'work',
      duration: FOCUS_DURATIONS.work,
      remainingSeconds: FOCUS_DURATIONS.work,
      isRunning: false,
      startedAt: null,
      sessionRound: 1,
      totalRounds: 4,
      participants: [],
      ambientSound: 'none',
    };
    focusRooms.set(channelId, room);
  }
  return room;
};

// Loop global de contagem regressiva sincronizada do servidor (Tick de 1s)
let globalFocusInterval: NodeJS.Timeout | null = null;

const startGlobalFocusTicker = (io: SocketIOServer) => {
  if (globalFocusInterval) return;

  globalFocusInterval = setInterval(() => {
    focusRooms.forEach((room, channelId) => {
      if (!room.isRunning) return;

      if (room.remainingSeconds > 0) {
        room.remainingSeconds -= 1;
        // Broadcast do pulso de sincronização para todos na sala
        io.to(`focus:${channelId}`).emit('focus:tick', {
          channelId,
          remainingSeconds: room.remainingSeconds,
          mode: room.mode,
          isRunning: true,
        });
      } else {
        // Bloco de foco ou pausa completado
        room.isRunning = false;
        room.startedAt = null;

        let nextMode: FocusMode = 'work';
        if (room.mode === 'work') {
          if (room.sessionRound % room.totalRounds === 0) {
            nextMode = 'long_break';
          } else {
            nextMode = 'short_break';
          }
          // Incrementa streak dos participantes presentes
          room.participants.forEach((p) => {
            p.streak = (p.streak || 0) + 1;
          });
        } else {
          // Após a pausa, avança o round de trabalho
          if (room.mode === 'long_break') {
            room.sessionRound = 1;
          } else {
            room.sessionRound += 1;
          }
          nextMode = 'work';
        }

        room.mode = nextMode;
        room.duration = FOCUS_DURATIONS[nextMode];
        room.remainingSeconds = FOCUS_DURATIONS[nextMode];

        io.to(`focus:${channelId}`).emit('focus:session-completed', {
          channelId,
          completedMode: room.mode === 'work' ? 'break' : 'work',
          nextMode,
          sessionRound: room.sessionRound,
          message:
            nextMode === 'work'
              ? 'Pausa encerrada! Hora de voltar ao foco profundo.'
              : 'Bloco de foco concluído com sucesso! Descanse a mente.',
        });

        io.to(`focus:${channelId}`).emit('focus:state', room);
      }
    });
  }, 1000);
};

export const registerFocusHandlers = (io: SocketIOServer, socket: Socket) => {
  startGlobalFocusTicker(io);

  // Entrada em Canal de Foco
  socket.on('focus:join-channel', (data: { channelId: string; user: any; initialTask?: string }) => {
    const { channelId, user, initialTask } = data;
    if (!channelId || !user) return;

    socket.join(`focus:${channelId}`);
    (socket as any).currentFocusChannel = channelId;
    (socket as any).focusUserId = user.id;

    const room = getOrCreateFocusRoom(channelId);

    // Adiciona ou atualiza participante
    const existingIndex = room.participants.findIndex((p) => p.userId === user.id);
    const participant: FocusParticipant = {
      socketId: socket.id,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      currentTask: initialTask || 'Foco Produtivo',
      isMuted: false,
      streak: existingIndex >= 0 ? room.participants[existingIndex].streak : 0,
      joinedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      room.participants[existingIndex] = participant;
    } else {
      room.participants.push(participant);
    }

    // Envia o estado completo e sincronizado ao usuário
    socket.emit('focus:state', room);

    // Notifica a sala da nova presença
    io.to(`focus:${channelId}`).emit('focus:participant-joined', {
      channelId,
      participant,
      totalParticipants: room.participants.length,
    });
  });

  // Saída do Canal de Foco
  socket.on('focus:leave-channel', (data: { channelId: string; userId: string }) => {
    const { channelId, userId } = data;
    if (!channelId) return;

    socket.leave(`focus:${channelId}`);
    const room = focusRooms.get(channelId);
    if (room) {
      room.participants = room.participants.filter((p) => p.userId !== userId && p.socketId !== socket.id);
      io.to(`focus:${channelId}`).emit('focus:participant-left', {
        channelId,
        userId,
        totalParticipants: room.participants.length,
      });
      io.to(`focus:${channelId}`).emit('focus:state', room);
    }
  });

  // Iniciar Cronômetro Pomodoro Sincronizado
  socket.on('focus:start', (data: { channelId: string }) => {
    const { channelId } = data;
    const room = getOrCreateFocusRoom(channelId);
    room.isRunning = true;
    room.startedAt = Date.now();

    io.to(`focus:${channelId}`).emit('focus:state', room);
    io.to(`focus:${channelId}`).emit('focus:started', {
      channelId,
      startedAt: room.startedAt,
      remainingSeconds: room.remainingSeconds,
      mode: room.mode,
    });
  });

  // Pausar Cronômetro
  socket.on('focus:pause', (data: { channelId: string }) => {
    const { channelId } = data;
    const room = getOrCreateFocusRoom(channelId);
    room.isRunning = false;
    room.startedAt = null;

    io.to(`focus:${channelId}`).emit('focus:state', room);
    io.to(`focus:${channelId}`).emit('focus:paused', {
      channelId,
      remainingSeconds: room.remainingSeconds,
    });
  });

  // Reiniciar Cronômetro / Definir Modo
  socket.on(
    'focus:set-mode',
    (data: { channelId: string; mode: FocusMode; customDurationSeconds?: number }) => {
      const { channelId, mode, customDurationSeconds } = data;
      const room = getOrCreateFocusRoom(channelId);

      const targetDuration = customDurationSeconds || FOCUS_DURATIONS[mode] || FOCUS_DURATIONS.work;
      room.mode = mode;
      room.duration = targetDuration;
      room.remainingSeconds = targetDuration;
      room.isRunning = false;
      room.startedAt = null;

      io.to(`focus:${channelId}`).emit('focus:state', room);
    }
  );

  // Reiniciar Bloco Atual
  socket.on('focus:reset', (data: { channelId: string }) => {
    const { channelId } = data;
    const room = getOrCreateFocusRoom(channelId);
    room.remainingSeconds = room.duration;
    room.isRunning = false;
    room.startedAt = null;

    io.to(`focus:${channelId}`).emit('focus:state', room);
  });

  // Atualizar Tarefa / Meta do Participante
  socket.on('focus:set-task', (data: { channelId: string; userId: string; task: string }) => {
    const { channelId, userId, task } = data;
    const room = getOrCreateFocusRoom(channelId);
    const participant = room.participants.find((p) => p.userId === userId || p.socketId === socket.id);
    if (participant) {
      participant.currentTask = task.substring(0, 120);
      io.to(`focus:${channelId}`).emit('focus:state', room);
    }
  });

  // Alternar Fundo Sonoro Sincronizado (Ambient Audio Preset)
  socket.on('focus:set-ambient', (data: { channelId: string; ambientSound: string }) => {
    const { channelId, ambientSound } = data;
    const room = getOrCreateFocusRoom(channelId);
    room.ambientSound = ambientSound;

    io.to(`focus:${channelId}`).emit('focus:ambient-changed', {
      channelId,
      ambientSound,
    });
    io.to(`focus:${channelId}`).emit('focus:state', room);
  });
};

// Desconexão do Usuário
export const handleFocusLeave = (io: SocketIOServer, socket: Socket) => {
  const channelId = (socket as any).currentFocusChannel;
  const userId = (socket as any).focusUserId;

  if (channelId) {
    const room = focusRooms.get(channelId);
    if (room) {
      room.participants = room.participants.filter(
        (p) => p.socketId !== socket.id && (userId ? p.userId !== userId : true)
      );
      io.to(`focus:${channelId}`).emit('focus:participant-left', {
        channelId,
        userId: userId || socket.id,
        totalParticipants: room.participants.length,
      });
      io.to(`focus:${channelId}`).emit('focus:state', room);
    }
  }
};
