import { Server, Socket } from 'socket.io';
import { messagesDb } from '../controllers/channelController';
import { Message } from '../types';

// Rate limiter em memória para proteção contra spam de mensagens
const userLastMessageTime = new Map<string, number>();

export const registerChatHandlers = (io: Server, socket: Socket) => {
  // Entrar em canal de texto
  socket.on('chat:join-channel', (channelId: string) => {
    if (typeof channelId === 'string' && channelId.length <= 64) {
      socket.join(`channel:${channelId}`);
    }
  });

  // Sair de canal de texto
  socket.on('chat:leave-channel', (channelId: string) => {
    if (typeof channelId === 'string') {
      socket.leave(`channel:${channelId}`);
    }
  });

  // Envio de nova mensagem com validação e proteção
  socket.on('chat:send-message', (data: { channelId: string; content: string; author: any; attachments?: any[] }) => {
    if (!data || typeof data !== 'object') return;
    const { channelId, content, author, attachments } = data;

    if (!channelId || typeof channelId !== 'string' || !content || typeof content !== 'string') {
      return;
    }

    const trimmedContent = content.trim();
    // Limita tamanho da mensagem a 2000 caracteres como no Discord
    if (trimmedContent.length === 0 || trimmedContent.length > 2000) {
      return;
    }

    // Rate limiting básico (máximo 1 mensagem a cada 200ms por socket)
    const now = Date.now();
    const lastTime = userLastMessageTime.get(socket.id) || 0;
    if (now - lastTime < 200) {
      return;
    }
    userLastMessageTime.set(socket.id, now);

    const safeRole: 'admin' | 'moderator' | 'member' =
      author?.role === 'admin' ? 'admin' : author?.role === 'moderator' ? 'moderator' : 'member';

    const safeAuthor = {
      id: typeof author?.id === 'string' ? author.id : socket.id,
      username: typeof author?.username === 'string' ? author.username.slice(0, 32) : 'Membro',
      discriminator: typeof author?.discriminator === 'string' ? author.discriminator.slice(0, 4) : '0000',
      avatarUrl: typeof author?.avatarUrl === 'string' && (author.avatarUrl.startsWith('http') || author.avatarUrl.startsWith('data:image/'))
        ? author.avatarUrl
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: safeRole,
    };

    const sanitizedAttachments = Array.isArray(attachments)
      ? attachments.slice(0, 5).map((att: any) => ({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: typeof att?.url === 'string' ? att.url : '',
          name: typeof att?.name === 'string' ? att.name.slice(0, 60) : 'arquivo',
          size: typeof att?.size === 'number' ? att.size : 1024 * 50,
          type: (att?.type === 'image' ? 'image' : 'file') as 'image' | 'file',
        }))
      : [];

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      author: safeAuthor,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      attachments: sanitizedAttachments,
      reactions: []
    };

    // Armazena no repositório em memória
    const channelMsgs = messagesDb.get(channelId) || [];
    channelMsgs.push(newMessage);
    // Limita o histórico mantido em memória a 200 mensagens por canal
    if (channelMsgs.length > 200) channelMsgs.shift();
    messagesDb.set(channelId, channelMsgs);

    // Emite para todos os usuários inscritos no canal
    io.to(`channel:${channelId}`).emit('chat:new-message', newMessage);
  });

  // Envio de resposta em thread / tópico
  socket.on('chat:send-thread-reply', (data: { channelId: string; parentMessageId: string; content: string; author: any; attachments?: any[] }) => {
    if (!data || typeof data !== 'object') return;
    const { channelId, parentMessageId, content, author, attachments } = data;
    if (!channelId || !parentMessageId || !content || typeof content !== 'string') return;

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 2000) return;

    const channelMsgs = messagesDb.get(channelId);
    if (!channelMsgs) return;

    const parentMessage = channelMsgs.find((m) => m.id === parentMessageId);
    if (!parentMessage) return;

    const safeRole: 'admin' | 'moderator' | 'member' =
      author?.role === 'admin' ? 'admin' : author?.role === 'moderator' ? 'moderator' : 'member';

    const safeAuthor = {
      id: typeof author?.id === 'string' ? author.id : socket.id,
      username: typeof author?.username === 'string' ? author.username.slice(0, 32) : 'Membro',
      discriminator: typeof author?.discriminator === 'string' ? author.discriminator.slice(0, 4) : '0000',
      avatarUrl: typeof author?.avatarUrl === 'string' && (author.avatarUrl.startsWith('http') || author.avatarUrl.startsWith('data:image/'))
        ? author.avatarUrl
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: safeRole,
    };

    const sanitizedAttachments = Array.isArray(attachments)
      ? attachments.slice(0, 5).map((att: any) => ({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: typeof att?.url === 'string' ? att.url : '',
          name: typeof att?.name === 'string' ? att.name.slice(0, 60) : 'arquivo',
          size: typeof att?.size === 'number' ? att.size : 1024 * 50,
          type: (att?.type === 'image' ? 'image' : 'file') as 'image' | 'file',
        }))
      : [];

    const newReply: Message = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      parentMessageId,
      author: safeAuthor,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      attachments: sanitizedAttachments,
      reactions: []
    };

    if (!parentMessage.threadReplies) {
      parentMessage.threadReplies = [];
    }
    parentMessage.threadReplies.push(newReply);
    parentMessage.threadCount = parentMessage.threadReplies.length;
    parentMessage.threadLastReplyAt = newReply.timestamp;

    // Emite para todos os usuários inscritos no canal
    io.to(`channel:${channelId}`).emit('chat:thread-reply-added', {
      channelId,
      parentMessageId,
      reply: newReply,
      threadCount: parentMessage.threadCount,
      threadLastReplyAt: parentMessage.threadLastReplyAt
    });
  });

  // Indicador de digitação com throttling
  socket.on('chat:typing', (data: { channelId: string; username: string; isTyping: boolean }) => {
    if (!data || typeof data !== 'object' || !data.channelId) return;
    socket.to(`channel:${data.channelId}`).emit('chat:user-typing', {
      channelId: data.channelId,
      username: typeof data.username === 'string' ? data.username.slice(0, 32) : 'Alguém',
      isTyping: Boolean(data.isTyping)
    });
  });

  // Edição de mensagem com validação e broadcast
  socket.on('chat:edit-message', (data: { channelId: string; messageId: string; content: string; userId?: string }) => {
    if (!data || typeof data !== 'object') return;
    const { channelId, messageId, content, userId } = data;

    if (!channelId || !messageId || typeof content !== 'string') {
      return;
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 2000) {
      return;
    }

    const channelMsgs = messagesDb.get(channelId);
    if (!channelMsgs) return;

    const message = channelMsgs.find((m) => m.id === messageId);
    if (!message) return;

    // Permite edição pelo autor ou por administradores
    if (userId && message.author.id !== userId && message.author.role !== 'admin') {
      return;
    }

    message.content = trimmedContent;
    message.edited = true;

    // Broadcast para todos os clientes conectados ao canal
    io.to(`channel:${channelId}`).emit('chat:message-edited', {
      channelId,
      messageId,
      content: message.content,
      edited: true
    });
  });

  // Reações com emojis validadas
  socket.on('chat:add-reaction', (data: { channelId: string; messageId: string; emoji: string; userId: string }) => {
    if (!data || typeof data !== 'object') return;
    const { channelId, messageId, emoji, userId } = data;
    if (!channelId || !messageId || !emoji || !userId) return;

    const msgs = messagesDb.get(channelId);
    if (!msgs) return;

    const message = msgs.find(m => m.id === messageId);
    if (!message) return;

    if (!message.reactions) message.reactions = [];

    const cleanEmoji = emoji.slice(0, 8);
    const existingReaction = message.reactions.find(r => r.emoji === cleanEmoji);
    if (existingReaction) {
      if (existingReaction.users.includes(userId)) {
        existingReaction.users = existingReaction.users.filter(id => id !== userId);
        existingReaction.count = existingReaction.users.length;
      } else {
        existingReaction.users.push(userId);
        existingReaction.count = existingReaction.users.length;
      }
    } else {
      message.reactions.push({
        emoji: cleanEmoji,
        count: 1,
        users: [userId]
      });
    }

    message.reactions = message.reactions.filter(r => r.count > 0);

    io.to(`channel:${channelId}`).emit('chat:reaction-updated', {
      channelId,
      messageId,
      reactions: message.reactions
    });
  });

  // Limpeza de histórico do canal (Apenas administradores)
  socket.on('chat:clear-history', (data: { channelId: string; user?: any; userId?: string }) => {
    if (!data || typeof data !== 'object') return;
    const { channelId, user } = data;

    if (!channelId || typeof channelId !== 'string') {
      return;
    }

    // Validação de privilégios de administrador
    if (!user || user.role !== 'admin') {
      socket.emit('chat:error', {
        message: 'Apenas administradores possuem autorização para limpar o histórico do canal.'
      });
      return;
    }

    // Remove todas as mensagens do canal no armazenamento em memória
    messagesDb.set(channelId, []);

    // Broadcast para todos os clientes conectados ao canal sincronizarem a exclusão em tempo real
    io.to(`channel:${channelId}`).emit('chat:history-cleared', {
      channelId,
      clearedBy: {
        id: user.id,
        username: typeof user.username === 'string' ? user.username : 'Administrador',
        avatarUrl: user.avatarUrl,
        role: 'admin'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Registro de identidade do usuário para recebimento de DMs privadas
  socket.on('user:identify', (userId: string) => {
    if (typeof userId === 'string' && userId.length <= 64) {
      socket.join(`user:${userId}`);
    }
  });

  // Envio e roteamento de Mensagem Privada (DM) em tempo real
  socket.on('dm:send-message', (data: { recipientId: string; content: string; author: any; attachments?: any[] }) => {
    if (!data || typeof data !== 'object') return;
    const { recipientId, content, author, attachments } = data;
    if (!recipientId || !content || typeof content !== 'string' || !author) return;

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 2000) return;

    const safeAuthor = {
      id: typeof author?.id === 'string' ? author.id : socket.id,
      username: typeof author?.username === 'string' ? author.username.slice(0, 32) : 'Tripulante',
      discriminator: typeof author?.discriminator === 'string' ? author.discriminator.slice(0, 4) : '0000',
      avatarUrl: typeof author?.avatarUrl === 'string' && (author.avatarUrl.startsWith('http') || author.avatarUrl.startsWith('data:image/'))
        ? author.avatarUrl
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: (author?.role === 'admin' ? 'admin' : author?.role === 'moderator' ? 'moderator' : 'member') as 'admin' | 'moderator' | 'member',
    };

    const sanitizedAttachments = Array.isArray(attachments)
      ? attachments.slice(0, 5).map((att: any) => ({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: typeof att?.url === 'string' ? att.url : '',
          name: typeof att?.name === 'string' ? att.name.slice(0, 60) : 'arquivo',
          size: typeof att?.size === 'number' ? att.size : 1024 * 50,
          type: (att?.type === 'image' ? 'image' : 'file') as 'image' | 'file',
        }))
      : [];

    const newDM: Message = {
      id: `dm-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId: `dm-${recipientId}`,
      author: safeAuthor,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      attachments: sanitizedAttachments,
      reactions: []
    };

    // Entrega a mensagem para a sala do destinatário e para a sala do autor (para sincronização entre abas)
    io.to(`user:${recipientId}`).emit('dm:new-message', {
      senderId: safeAuthor.id,
      recipientId,
      message: newDM
    });
    io.to(`user:${safeAuthor.id}`).emit('dm:new-message', {
      senderId: safeAuthor.id,
      recipientId,
      message: newDM
    });
  });

  // Limpeza de memória ao desconectar
  socket.on('disconnect', () => {
    userLastMessageTime.delete(socket.id);
  });
};
