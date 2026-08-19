import { Request, Response } from 'express';
import { INITIAL_CHANNELS } from '../config';
import { Message, Channel } from '../types';
import { AuthRequest } from '../middlewares/auth';

// Armazenamento em memória de mensagens por canal
export const messagesDb: Map<string, Message[]> = new Map();

// Mensagens iniciais de boas-vindas e arquitetura
const seedInitialMessages = () => {
  const generalMessages: Message[] = [
    {
      id: 'msg-1',
      channelId: 'c-general',
      author: {
        id: 'usr-admin-1',
        username: 'Luiz',
        discriminator: '0001',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'admin'
      },
      content: '👋 Bem-vindos à base do Discord Clone! A arquitetura conta com **Node.js/Express**, **Socket.io** e **WebRTC** para áudio e vídeo.',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      isPinned: true,
      reactions: [{ emoji: '🚀', count: 3, users: ['usr-dev-2', 'usr-guest-3'] }, { emoji: '❤️', count: 2, users: ['usr-dev-2'] }],
      threadCount: 2,
      threadLastReplyAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      threadReplies: [
        {
          id: 'reply-1',
          channelId: 'c-general',
          parentMessageId: 'msg-1',
          author: {
            id: 'usr-guest-3',
            username: 'Camila_UX',
            discriminator: '2048',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            role: 'member'
          },
          content: 'Sensacional! O painel lateral de threads organiza o contexto perfeitamente sem poluir o canal principal.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          reactions: [{ emoji: '✨', count: 2, users: ['usr-admin-1'] }]
        },
        {
          id: 'reply-2',
          channelId: 'c-general',
          parentMessageId: 'msg-1',
          author: {
            id: 'usr-dev-2',
            username: 'Dev_Alex',
            discriminator: '1337',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            role: 'moderator'
          },
          content: 'Podemos testar o envio de novas respostas em tempo real pela thread aberta!',
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
        }
      ]
    },
    {
      id: 'msg-2',
      channelId: 'c-general',
      author: {
        id: 'usr-dev-2',
        username: 'Dev_Alex',
        discriminator: '1337',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'moderator'
      },
      content: 'As salas de voz utilizam sinalização via Socket.io com negociação de ICE Candidates e streams de microfone/webcam. Testem entrar em `🔊 Geral - Voz & Vídeo`!',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      reactions: [{ emoji: '🔥', count: 2, users: ['usr-admin-1'] }]
    }
  ];

  const devMessages: Message[] = [
    {
      id: 'msg-3',
      channelId: 'c-dev',
      author: {
        id: 'usr-admin-1',
        username: 'Luiz',
        discriminator: '0001',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'admin'
      },
      content: '🔐 **Segurança Implementada:**\n- Hashing de senhas via `bcrypt` com salt rounds = 12\n- Proteção contra Timing Attacks (dummy hash execution)\n- Rate limiting rigoroso com `express-rate-limit` contra força bruta\n- Schemas de validação estritos com `zod`',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      isPinned: true,
      reactions: [{ emoji: '🛡️', count: 4, users: ['usr-dev-2', 'usr-guest-3'] }]
    }
  ];

  messagesDb.set('c-general', generalMessages);
  messagesDb.set('c-dev', devMessages);
  messagesDb.set('c-showcase', []);
  messagesDb.set('c-rules', [
    {
      id: 'msg-4',
      channelId: 'c-rules',
      author: {
        id: 'usr-admin-1',
        username: 'Luiz',
        discriminator: '0001',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'admin'
      },
      content: '📌 **Regras do Servidor:**\n1. Respeite todos os membros.\n2. Não envie spam ou scripts de flooding.\n3. Utilize os canais temáticos adequadamente.',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
};

seedInitialMessages();

export const getChannels = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    channels: INITIAL_CHANNELS
  });
};

export const getChannelMessages = async (req: Request, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const messages = messagesDb.get(channelId) || [];
  
  res.json({
    success: true,
    channelId,
    messages
  });
};

export const postChannelMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const { content, attachments } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Não autorizado.' });
    return;
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Conteúdo da mensagem inválido.' });
    return;
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    channelId,
    author: {
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatarUrl: req.user.avatarUrl,
      role: req.user.role
    },
    content: content.trim(),
    timestamp: new Date().toISOString(),
    attachments: attachments || [],
    reactions: []
  };

  const channelMsgs = messagesDb.get(channelId) || [];
  channelMsgs.push(newMessage);
  messagesDb.set(channelId, channelMsgs);

  res.status(201).json({
    success: true,
    message: newMessage
  });
};

export const patchChannelMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId, messageId } = req.params;
  const { content } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Não autorizado.' });
    return;
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Conteúdo da mensagem inválido.' });
    return;
  }

  const channelMsgs = messagesDb.get(channelId);
  if (!channelMsgs) {
    res.status(404).json({ success: false, error: 'Canal não encontrado.' });
    return;
  }

  const message = channelMsgs.find(m => m.id === messageId);
  if (!message) {
    res.status(404).json({ success: false, error: 'Mensagem não encontrada.' });
    return;
  }

  if (message.author.id !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Você só pode editar suas próprias mensagens.' });
    return;
  }

  message.content = content.trim();
  message.edited = true;

  res.json({
    success: true,
    message
  });
};

export const clearChannelMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Não autorizado.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Apenas administradores podem limpar o histórico de mensagens.' });
    return;
  }

  messagesDb.set(channelId, []);

  res.json({
    success: true,
    message: 'Histórico do canal limpo com sucesso.',
    channelId
  });
};

