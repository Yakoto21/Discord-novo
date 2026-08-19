import { ServerGuild, Channel, Friend, User, Message } from '../types';
import { PRESET_SERVER_THEMES } from './themes';

export const INITIAL_SERVERS: ServerGuild[] = [
  {
    id: 'guild-main',
    name: 'Dev Community Brasil',
    acronym: 'DEV',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    description: 'Comunidade oficial de desenvolvedores, WebRTC, Full Stack e Cloud.',
    unread: false,
    memberCount: 1420,
    theme: PRESET_SERVER_THEMES['cyber-cyan'],
    channels: [
      { id: 'c-general', serverId: 'guild-main', name: 'geral', type: 'text', category: 'CANAIS DE TEXTO', topic: 'Canal principal para conversas da comunidade e novidades' },
      { id: 'c-dev', serverId: 'guild-main', name: 'desenvolvimento', type: 'text', category: 'CANAIS DE TEXTO', topic: 'Discussões sobre React, WebRTC, Socket.io, Node.js e arquitetura' },
      { id: 'c-showcase', serverId: 'guild-main', name: 'projetos-showcase', type: 'text', category: 'CANAIS DE TEXTO', topic: 'Compartilhe seus repositórios, demos e capturas de tela' },
      { id: 'f-deepwork', serverId: 'guild-main', name: 'Sala Pomodoro Deep Work', type: 'focus', category: 'CANAIS DE FOCO', topic: 'Foco coletivo com técnica Pomodoro sincronizada e DND automático' },
      { id: 'f-code-sprint', serverId: 'guild-main', name: 'Code Sprint & Estudo 25m', type: 'focus', category: 'CANAIS DE FOCO', topic: 'Ciclos de 25 min de foco para programar sem distrações' },
      { id: 'c-rules', serverId: 'guild-main', name: 'regras-e-segurança', type: 'text', category: 'INFORMAÇÕES', topic: 'Diretrizes de convivência e especificações de segurança da API' },
      { id: 'v-general', serverId: 'guild-main', name: 'Geral - Voz & Vídeo', type: 'voice', category: 'CANAIS DE VOZ', topic: 'Sala de voz principal com suporte a webcam e transmissão' },
      { id: 'v-dev', serverId: 'guild-main', name: 'Reunião Dev & Pair Code', type: 'voice', category: 'CANAIS DE VOZ', topic: 'Espaço para pair programming e compartilhamento de tela' },
      { id: 'v-chill', serverId: 'guild-main', name: 'Lounge & Games', type: 'voice', category: 'CANAIS DE VOZ', topic: 'Bate-papo descontraído e jogos' }
    ]
  },
  {
    id: 'guild-webrtc',
    name: 'WebRTC & Real-Time Lab',
    acronym: 'RTC',
    iconUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&auto=format&fit=crop&q=80',
    description: 'Pesquisa avançada em P2P Mesh, STUN/TURN, SDP, VAD e WebSockets.',
    unread: true,
    mentionCount: 3,
    memberCount: 890,
    theme: PRESET_SERVER_THEMES['matrix-emerald'],
    channels: [
      { id: 'rtc-announcements', serverId: 'guild-webrtc', name: 'anúncios-webrtc', type: 'text', category: 'PRINCIPAL', topic: 'Atualizações sobre novos protocolos e codecs' },
      { id: 'rtc-signaling', serverId: 'guild-webrtc', name: 'p2p-sinalizacao', type: 'text', category: 'TECNOLOGIA', topic: 'Técnicas de handshake com Socket.io e ICE Candidates' },
      { id: 'rtc-audio-dsp', serverId: 'guild-webrtc', name: 'audio-vad-analyser', type: 'text', category: 'TECNOLOGIA', topic: 'Web Audio API, filtros passa-baixa e Voice Activity Detection' },
      { id: 'f-rtc-focus', serverId: 'guild-webrtc', name: 'Lab Sprint & Deep Code', type: 'focus', category: 'CANAIS DE FOCO', topic: 'Sessões de 25 min de foco para refatoração e otimização' },
      { id: 'v-rtc-lab', serverId: 'guild-webrtc', name: 'Lab de Testes WebRTC', type: 'voice', category: 'SALAS DE TESTE', topic: 'Ambiente para testar streaming de câmera e áudio P2P' },
      { id: 'v-rtc-debug', serverId: 'guild-webrtc', name: 'Debugging em Grupo', type: 'voice', category: 'SALAS DE TESTE', topic: 'Análise de latência e perda de pacotes' }
    ]
  },
  {
    id: 'guild-stack',
    name: 'Node.js & Express Architecture',
    acronym: 'ND',
    iconUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=80',
    description: 'Boas práticas em backend, segurança, Bcrypt, JWT, Rate Limiting e Zod.',
    unread: false,
    memberCount: 2150,
    theme: PRESET_SERVER_THEMES['solar-amber'],
    channels: [
      { id: 'nd-general', serverId: 'guild-stack', name: 'arquitetura-backend', type: 'text', category: 'DISCUSSÕES', topic: 'Padrões de projeto, Clean Architecture e MVC em Node.js' },
      { id: 'nd-security', serverId: 'guild-stack', name: 'segurança-e-autenticação', type: 'text', category: 'DISCUSSÕES', topic: 'Defesa contra Timing Attacks e Brute Force' },
      { id: 'nd-benchmarks', serverId: 'guild-stack', name: 'benchmarks-desempenho', type: 'text', category: 'DISCUSSÕES', topic: 'Testes de carga e otimização de event loop' },
      { id: 'f-nd-study', serverId: 'guild-stack', name: 'Sala Pomodoro Backend', type: 'focus', category: 'CANAIS DE FOCO', topic: 'Estudo intensivo e revisão de PRs' },
      { id: 'v-nd-meet', serverId: 'guild-stack', name: 'Mesa Redonda Node.js', type: 'voice', category: 'VOZ', topic: 'Discussões semanais de arquitetura' }
    ]
  },
  {
    id: 'guild-games',
    name: 'Gaming & Chill Lounge',
    acronym: 'GG',
    iconUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop&q=80',
    description: 'Espaço gamer para relaxar, jogar multiplayer e compartilhar clipes.',
    unread: false,
    memberCount: 3400,
    theme: PRESET_SERVER_THEMES['synthwave-purple'],
    channels: [
      { id: 'gg-chat', serverId: 'guild-games', name: 'geral-games', type: 'text', category: 'COMUNIDADE', topic: 'Bate-papo sobre lançamentos, RPGs, FPS e indies' },
      { id: 'gg-clips', serverId: 'guild-games', name: 'clipes-e-jogadas', type: 'text', category: 'COMUNIDADE', topic: 'Envie seus melhores momentos em vídeo ou imagem' },
      { id: 'f-game-grind', serverId: 'guild-games', name: 'Speedrun & Grind Focus', type: 'focus', category: 'CANAIS DE FOCO', topic: 'Sessões temporizadas para treino e grind' },
      { id: 'v-squad-1', serverId: 'guild-games', name: 'Squad Alfa (Valorant/CS)', type: 'voice', category: 'SALAS DE JOGOS', topic: 'Call tática para jogos competitivos' },
      { id: 'v-squad-2', serverId: 'guild-games', name: 'Lounge Casual', type: 'voice', category: 'SALAS DE JOGOS', topic: 'Converse enquanto joga qualquer coisa' }
    ]
  }
];

export const DISCOVERABLE_SERVERS: ServerGuild[] = [
  {
    id: 'disc-typescript',
    name: 'TypeScript & JavaScript Brasil',
    acronym: 'TS',
    iconUrl: 'https://images.unsplash.com/photo-1516116211227-bbc13c72b22b?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    description: 'A maior comunidade de desenvolvedores TypeScript, tipos avançados, utilitários e ecossistema.',
    memberCount: 15400,
    category: 'Tecnologia',
    isPublic: true,
    channels: [
      { id: 'ts-geral', name: 'geral-typescript', type: 'text', category: 'GERAL', topic: 'Tire dúvidas sobre tipagem estática e generics' },
      { id: 'ts-voice', name: 'Auditório TS', type: 'voice', category: 'VOZ', topic: 'Palestras e debates' }
    ]
  },
  {
    id: 'disc-react',
    name: 'React & Next.js Ecosystem',
    acronym: 'RC',
    iconUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    description: 'Hooks, Server Components, Zustand, Tailwind CSS, microfrontends e animações com Framer Motion.',
    memberCount: 28900,
    category: 'Tecnologia',
    isPublic: true,
    channels: [
      { id: 'rc-geral', name: 'react-chat', type: 'text', category: 'GERAL', topic: 'Discussões e arquitetura de interfaces modernas' },
      { id: 'rc-voice', name: 'Sala de Code Review', type: 'voice', category: 'VOZ', topic: 'Avaliação de componentes ao vivo' }
    ]
  },
  {
    id: 'disc-ai',
    name: 'AI Engineering & LLM Lab',
    acronym: 'AI',
    iconUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    description: 'Desenvolvimento de agentes de IA, RAG, modelos Gemini, OpenAI e automações multimodais.',
    memberCount: 42300,
    category: 'Inteligência Artificial',
    isPublic: true,
    channels: [
      { id: 'ai-prompting', name: 'agentes-e-rag', type: 'text', category: 'IA', topic: 'Técnicas de engenharia de contexto' },
      { id: 'ai-voice', name: 'Demoday de IA', type: 'voice', category: 'VOZ', topic: 'Demonstrações de protótipos inteligentes' }
    ]
  },
  {
    id: 'disc-cyber',
    name: 'CyberSecurity & Ethical Hacking',
    acronym: 'SEC',
    iconUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    description: 'Segurança da informação, testes de intrusão, criptografia, auditoria de código e Blue Team.',
    memberCount: 19800,
    category: 'Segurança',
    isPublic: true,
    channels: [
      { id: 'sec-chat', name: 'radar-vulnerabilidades', type: 'text', category: 'SEGURANÇA', topic: 'CVEs recentes e correções' },
      { id: 'sec-voice', name: 'War Room CTF', type: 'voice', category: 'VOZ', topic: 'Resolução de desafios de segurança' }
    ]
  },
  {
    id: 'disc-lofi',
    name: 'Lo-Fi Chill & Focus Music',
    acronym: 'LF',
    iconUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    description: 'Músicas lo-fi, beats relaxantes, foco em estudo e programação com amigos.',
    memberCount: 55000,
    category: 'Música',
    isPublic: true,
    channels: [
      { id: 'lf-chat', name: 'sugestoes-musicas', type: 'text', category: 'MÚSICA', topic: 'Compartilhe playlists do Spotify e YouTube' },
      { id: 'lf-voice', name: 'Rádio 24/7 Lo-Fi', type: 'voice', category: 'VOZ', topic: 'Sala de estudo silenciosa com música' }
    ]
  }
];

export const INITIAL_FRIENDS: Friend[] = [];

export const POPULAR_GIFS = [
  { id: 'gif-1', title: 'Celebration Confetti', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', preview: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif' },
  { id: 'gif-2', title: 'Hacker Coding', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif', preview: 'https://media.giphy.com/media/unQ3IJU2RG7DO/200w.gif' },
  { id: 'gif-3', title: 'Cat Jam Dancing', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif', preview: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/200w.gif' },
  { id: 'gif-4', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', preview: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif' },
  { id: 'gif-5', title: 'Popcorn Chill', url: 'https://media.giphy.com/media/hVTouq08miyGT52UKL/giphy.gif', preview: 'https://media.giphy.com/media/hVTouq08miyGT52UKL/200w.gif' },
  { id: 'gif-6', title: 'Thumbs Up Good Job', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', preview: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif' },
  { id: 'gif-7', title: 'Thinking Fast', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif', preview: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/200w.gif' },
  { id: 'gif-8', title: 'This is Fine Dog', url: 'https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/giphy.gif', preview: 'https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/200w.gif' }
];

export const INITIAL_DM_MESSAGES: Record<string, Message[]> = {};
