import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'discord_clone_super_secure_jwt_secret_key_2026',
  jwtExpiresIn: '7d',
  saltRounds: 12, // Custo de 12 para bcrypt (resistente a força bruta e hardware dedicado)
  
  // Rate limiting configuration
  rateLimiting: {
    authWindowMs: 15 * 60 * 1000, // 15 minutos
    authMaxAttempts: 10, // Máximo de 10 tentativas de login/registro por IP
    apiWindowMs: 1 * 60 * 1000, // 1 minuto
    apiMaxRequests: 120, // 120 requisições gerais por minuto por IP
  },

  // ICE Servers para WebRTC (STUN públicos para conectividade NAT traversal)
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export const INITIAL_CHANNELS = [
  { id: 'c-general', name: 'geral', type: 'text' as const, category: 'CANAIS DE TEXTO', topic: 'Canal principal para conversas da comunidade e novidades' },
  { id: 'c-dev', name: 'desenvolvimento', type: 'text' as const, category: 'CANAIS DE TEXTO', topic: 'Discussões sobre React, WebRTC, Socket.io, Node.js e arquitetura' },
  { id: 'c-showcase', name: 'projetos-showcase', type: 'text' as const, category: 'CANAIS DE TEXTO', topic: 'Compartilhe seus repositórios, demos e capturas de tela' },
  { id: 'f-deepwork', name: 'Sala Pomodoro Deep Work', type: 'focus' as const, category: 'CANAIS DE FOCO', topic: 'Foco coletivo com técnica Pomodoro sincronizada, gerador de ruído ambiente e silêncio automático' },
  { id: 'f-code-sprint', name: 'Code Sprint & Estudo 25m', type: 'focus' as const, category: 'CANAIS DE FOCO', topic: 'Ciclos de 25 min de foco para programar e estudar sem distrações' },
  { id: 'c-rules', name: 'regras-e-segurança', type: 'text' as const, category: 'INFORMAÇÕES', topic: 'Diretrizes de convivência e especificações de segurança da API' },
  { id: 'v-general', name: 'Geral - Voz & Vídeo', type: 'voice' as const, category: 'CANAIS DE VOZ', topic: 'Sala de voz principal com suporte a webcam e transmissão' },
  { id: 'v-dev', name: 'Reunião Dev & Pair Code', type: 'voice' as const, category: 'CANAIS DE VOZ', topic: 'Espaço para pair programming e compartilhamento de tela' },
  { id: 'v-chill', name: 'Lounge & Games', type: 'voice' as const, category: 'CANAIS DE VOZ', topic: 'Bate-papo descontraído e jogos' }
];
