import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { registerChatHandlers } from './chatHandler';
import { registerVoiceHandlers, handleVoiceLeave } from './voiceHandler';
import { registerFocusHandlers, handleFocusLeave } from './focusHandler';

export const initSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true,
    maxHttpBufferSize: 1e8,
  });

  io.on('connection', (socket) => {
    // Registra os módulos de Chat, Voz WebRTC e Canais de Foco Pomodoro
    registerChatHandlers(io, socket);
    registerVoiceHandlers(io, socket);
    registerFocusHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      // Limpeza automática se o usuário estava conectado em uma sala de voz ou foco
      handleVoiceLeave(io, socket);
      handleFocusLeave(io, socket);
    });

    socket.on('error', (err) => {
      console.warn(`[Socket Error] (${socket.id}):`, err);
    });
  });

  return io;
};

