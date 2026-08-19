import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

    socketInstance = io(origin, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.io conectado com sucesso! ID:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Tentando reconexão Socket.io:', err.message);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.io reconectado após', attemptNumber, 'tentativas');
    });
  }

  return socketInstance;
};

