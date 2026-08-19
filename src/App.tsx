import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServerSidebar } from './components/layout/ServerSidebar';
import { ChannelSidebar } from './components/layout/ChannelSidebar';
import { DirectMessageSidebar } from './components/home/DirectMessageSidebar';
import { FriendsView } from './components/home/FriendsView';
import { NitroView } from './components/home/NitroView';
import { DiscoverView } from './components/discover/DiscoverView';
import { ChatArea } from './components/chat/ChatArea';
import { DirectMessageChat } from './components/chat/DirectMessageChat';
import { MemberList } from './components/layout/MemberList';
import { VoiceChannelView } from './components/voice/VoiceChannelView';
import { FocusChannelView } from './components/focus/FocusChannelView';
import { ActiveVoiceBar } from './components/voice/ActiveVoiceBar';
import { AuthModal } from './components/auth/AuthModal';
import { SecurityModal } from './components/settings/SecurityModal';
import { CreateServerModal } from './components/modals/CreateServerModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import { InviteModal } from './components/modals/InviteModal';
import { ServerSettingsModal } from './components/modals/ServerSettingsModal';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { UserProfilePopover } from './components/modals/UserProfilePopover';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { GlobalSystemConfig } from './components/modals/AdminControlPanel';
import { Mic, Headphones, Keyboard, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

import { api, getAuthToken, removeAuthToken, setAuthToken } from './services/api';
import { getSocket } from './services/socket';
import { useWebRTC } from './hooks/useWebRTC';
import { useFocusChannel } from './hooks/useFocusChannel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { INITIAL_SERVERS, INITIAL_FRIENDS, INITIAL_DM_MESSAGES } from './data/initialData';
import { PRESET_SERVER_THEMES } from './data/themes';
import { playSound } from './utils/soundEffects';
import {
  notifyIfBackground,
  requestNotificationPermission,
  isNotificationSupported,
} from './utils/browserNotifications';
import { Channel, Message, User, VoiceParticipant, ServerGuild, Friend } from './types';
import {
  testFirestoreConnection,
  saveMessage,
  saveThreadReply,
  syncUserProfile,
  getChannelMessages,
  saveServer,
  saveChannel,
} from './services/firestoreService';

export default function App() {
  // Estado de Autenticação e Usuário Conectado
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Estados de Servidores e Navegação
  const [servers, setServers] = useState<ServerGuild[]>(INITIAL_SERVERS);
  const [activeServerId, setActiveServerId] = useState<string>('guild-main');
  const [homeTab, setHomeTab] = useState<string>('friends');

  // Estados de Canais e Mensagens
  const [channelsByServer, setChannelsByServer] = useState<Record<string, Channel[]>>({});
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<Channel | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'voice'>('chat');

  // Amigos e Mensagens Diretas (DMs)
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [dmHistory, setDmHistory] = useState<Record<string, Message[]>>(INITIAL_DM_MESSAGES);

  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({});
  const [members, setMembers] = useState<User[]>([]);
  const [voiceRoomsStatus, setVoiceRoomsStatus] = useState<Record<string, VoiceParticipant[]>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Estados dos Modais
  const [showMemberList, setShowMemberList] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [createChannelType, setCreateChannelType] = useState<'text' | 'voice' | 'focus'>('text');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showServerSettingsModal, setShowServerSettingsModal] = useState(false);
  const [targetSettingsServer, setTargetSettingsServer] = useState<ServerGuild | null>(null);
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);
  const [userSettingsInitialTab, setUserSettingsInitialTab] = useState<'account' | 'profile' | 'voice_video' | 'appearance' | 'security' | 'keybinds' | 'admin'>('account');
  const [popoverUser, setPopoverUser] = useState<User | null>(null);

  // Configuração Global de Sistema do Painel de Administrador
  const [systemConfig, setSystemConfig] = useState<GlobalSystemConfig>({
    appTitle: 'Discord Quantum',
    globalTheme: 'cyan',
    ambientGlowIntensity: 65,
    uiCornerRadius: 'normal',
    maintenanceMode: false,
    activeBroadcast: null,
    simulatedLatencyMs: 0,
  });

  const handleUpdateTargetMember = (userId: string, data: Partial<User>) => {
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, ...data } : m)));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev));
    }
    setFriends((prev) =>
      prev.map((f) => (f.user.id === userId ? { ...f, user: { ...f.user, ...data } } : f))
    );
  };

  // WebRTC Hook
  const {
    participants,
    localStream,
    isMuted,
    isDeafened,
    isVideoOn,
    isScreenSharing,
    cursorMode,
    isSpeakingLocally,
    mediaError,
    getDiagnostics,
    logDiagnostics,
    toggleCursorMode,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    disconnectVoice,
  } = useWebRTC({
    currentUser,
    activeVoiceChannelId: activeVoiceChannel?.id || null,
  });

  // Focus / Pomodoro Channel Hook
  const {
    focusState,
    ambientSound,
    ambientVolume,
    userTask,
    isDNDActive,
    joinFocusChannel,
    leaveFocusChannel,
    startTimer: startFocusTimer,
    pauseTimer: pauseFocusTimer,
    resetTimer: resetFocusTimer,
    setMode: setFocusMode,
    setTask: setFocusTask,
    setAmbient: setFocusAmbient,
    setVolume: setFocusVolume,
  } = useFocusChannel(currentUser);

  // Inicialização do Usuário (Verifica sessão existente ou aguarda login)
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
        } catch {
          removeAuthToken();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    };

    initAuth();
    testFirestoreConnection().catch((err) => console.warn('Firestore initial boot test:', err));
  }, []);

  // Carrega canais da API e servidores pré-configurados
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [channelsRes, membersRes] = await Promise.all([
          api.getChannels(),
          api.getMembers(),
        ]);

        const initialMap: Record<string, Channel[]> = {};
        INITIAL_SERVERS.forEach((srv) => {
          initialMap[srv.id] = srv.channels ? [...srv.channels] : [];
        });

        // Mescla e deduplica canais da API no guild-main
        if (channelsRes.channels && channelsRes.channels.length > 0) {
          const channelMap = new Map<string, Channel>();
          (INITIAL_SERVERS[0].channels || []).forEach((c) => channelMap.set(c.id, c));
          channelsRes.channels.forEach((c: Channel) => channelMap.set(c.id, c));
          initialMap['guild-main'] = Array.from(channelMap.values());
        }

        // Garante unicidade absoluta de IDs em todos os servidores
        Object.keys(initialMap).forEach((srvId) => {
          const seen = new Set<string>();
          initialMap[srvId] = initialMap[srvId].filter((c) => {
            if (!c?.id || seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });
        });

        setChannelsByServer(initialMap);
        setMembers(membersRes.members);

        const defaultChan = (initialMap['guild-main'] || []).find((c) => c.type === 'text') || (initialMap['guild-main'] || [])[0];
        if (defaultChan) {
          setActiveChannel(defaultChan);
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    loadInitialData();
  }, []);

  // Gerenciamento de Canais de Foco Ativos
  useEffect(() => {
    if (activeChannel && activeChannel.type === 'focus') {
      joinFocusChannel(activeChannel.id);
      return () => {
        leaveFocusChannel();
      };
    }
  }, [activeChannel?.id, activeChannel?.type, joinFocusChannel, leaveFocusChannel]);

  // Carrega mensagens do canal quando selecionado (REST + Firestore)
  useEffect(() => {
    if (!activeChannel || activeChannel.type !== 'text') return;

    const fetchMessages = async () => {
      try {
        const [res, cloudMsgs] = await Promise.allSettled([
          api.getMessages(activeChannel.id),
          getChannelMessages(activeChannel.id),
        ]);

        const restMsgs = res.status === 'fulfilled' && res.value?.messages ? res.value.messages : [];
        const firestoreMsgs = cloudMsgs.status === 'fulfilled' && cloudMsgs.value ? cloudMsgs.value : [];

        const mergedMap = new Map<string, Message>();
        restMsgs.forEach((m: Message) => mergedMap.set(m.id, m));
        firestoreMsgs.forEach((m: Message) => mergedMap.set(m.id, m));

        const finalMsgs = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setMessagesByChannel((prev) => ({
          ...prev,
          [activeChannel.id]: finalMsgs,
        }));
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
      }
    };

    fetchMessages();

    const socket = getSocket();
    socket.emit('chat:join-channel', activeChannel.id);

    return () => {
      socket.emit('chat:leave-channel', activeChannel.id);
    };
  }, [activeChannel]);

  // Solicitação de permissão nativa de notificações ao iniciar ou autenticar
  useEffect(() => {
    if (currentUser && isNotificationSupported()) {
      // Solicita permissão suave se ainda não respondido
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => {
          requestNotificationPermission().catch(() => {});
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  // Listener de eventos do Socket.IO com Notificações do Navegador em background
  useEffect(() => {
    const socket = getSocket();
    socket.emit('voice:get-rooms-status');

    if (currentUser?.id) {
      socket.emit('user:identify', currentUser.id);
    }

    const handleNewMessage = (newMessage: Message) => {
      setMessagesByChannel((prev) => {
        const channelMsgs = prev[newMessage.channelId] || [];
        if (channelMsgs.some((m) => m.id === newMessage.id)) return prev;
        return {
          ...prev,
          [newMessage.channelId]: [...channelMsgs, newMessage],
        };
      });
      saveMessage(newMessage).catch((err) => console.warn('Sync message to Firestore:', err));

      const isIncoming = newMessage.author.id !== currentUser?.id;
      if (isIncoming && !isDNDActive) {
        // Verifica se o usuário logado foi mencionado diretamente ou por cargo
        const isMentioned = Boolean(
          currentUser && (
            newMessage.content.includes(`@${currentUser.username}`) ||
            newMessage.content.includes('@everyone') ||
            newMessage.content.includes('@here') ||
            (currentUser.role === 'admin' && newMessage.content.includes('@admin')) ||
            (currentUser.role === 'moderator' && newMessage.content.includes('@mod'))
          )
        );

        // Dispara efeito sonoro apropriado (menção ou mensagem padrão)
        if (isMentioned) {
          playSound('mention');
        } else {
          playSound('message_receive');
        }

        // Localiza canal e servidor para link direto na notificação
        const allChannelsList: Channel[] = Object.values(channelsByServer).flat() as Channel[];
        const targetChan = allChannelsList.find((c) => c.id === newMessage.channelId) || activeChannel;
        const targetServer = servers.find((s) => s.id === targetChan?.serverId);

        // Alerta nativo do navegador caso o app esteja em segundo plano ou minimizado
        if (isMentioned) {
          notifyIfBackground({
            title: `🔔 Menção de @${newMessage.author.username} em #${targetChan?.name || 'chat'}`,
            body: newMessage.content,
            icon: newMessage.author.avatarUrl,
            tag: `mention-${newMessage.id}`,
            isMention: true,
            onClick: () => {
              if (targetServer) setActiveServerId(targetServer.id);
              if (targetChan) {
                setActiveChannel(targetChan);
                setViewMode('chat');
              }
            },
          });
        } else {
          notifyIfBackground({
            title: `${newMessage.author.username} (#${targetChan?.name || 'chat'})`,
            body: newMessage.content,
            icon: newMessage.author.avatarUrl,
            tag: `msg-${newMessage.id}`,
            onClick: () => {
              if (targetServer) setActiveServerId(targetServer.id);
              if (targetChan) {
                setActiveChannel(targetChan);
                setViewMode('chat');
              }
            },
          });
        }
      }
    };

    const handleNewDM = (data: { senderId: string; recipientId: string; message: Message }) => {
      if (!data || !data.message) return;
      const isIncoming = data.message.author.id !== currentUser?.id;
      const conversationUserId = isIncoming ? data.senderId : data.recipientId;

      setDmHistory((prev) => {
        const history = prev[conversationUserId] || [];
        if (history.some((m) => m.id === data.message.id)) return prev;
        return {
          ...prev,
          [conversationUserId]: [...history, data.message],
        };
      });

      if (isIncoming && !isDNDActive) {
        playSound('message_receive');

        // Notificação nativa no SO/Navegador para Mensagens Diretas em background
        notifyIfBackground({
          title: `💬 Mensagem Privada de ${data.message.author.username}`,
          body: data.message.content,
          icon: data.message.author.avatarUrl,
          tag: `dm-${data.message.id}`,
          onClick: () => {
            setActiveServerId('home');
            setHomeTab(`dm-${conversationUserId}`);
          },
        });
      }
    };

    const handleUserTyping = (data: { channelId: string; username: string; isTyping: boolean }) => {
      if (activeChannel && data.channelId === activeChannel.id) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            return prev.includes(data.username) ? prev : [...prev, data.username];
          } else {
            return prev.filter((u) => u !== data.username);
          }
        });
      }
    };

    const handleReactionUpdated = (data: { channelId: string; messageId: string; reactions: any[] }) => {
      setMessagesByChannel((prev) => {
        const channelMsgs = prev[data.channelId] || [];
        return {
          ...prev,
          [data.channelId]: channelMsgs.map((m) =>
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m
          ),
        };
      });
    };

    const handleMessageEdited = (data: { channelId: string; messageId: string; content: string; edited: boolean }) => {
      setMessagesByChannel((prev) => {
        const channelMsgs = prev[data.channelId] || [];
        return {
          ...prev,
          [data.channelId]: channelMsgs.map((m) =>
            m.id === data.messageId ? { ...m, content: data.content, edited: true } : m
          ),
        };
      });
    };

    const handleHistoryCleared = (data: { channelId: string; clearedBy?: any; timestamp?: string }) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [data.channelId]: [],
      }));
    };

    const handleThreadReplyAdded = (data: { channelId: string; parentMessageId: string; reply: Message }) => {
      setMessagesByChannel((prev) => {
        const channelMsgs = prev[data.channelId] || [];
        return {
          ...prev,
          [data.channelId]: channelMsgs.map((m) => {
            if (m.id === data.parentMessageId) {
              const currentReplies = m.threadReplies || [];
              if (currentReplies.some((r) => r.id === data.reply.id)) return m;
              return {
                ...m,
                threadReplies: [...currentReplies, data.reply],
                threadCount: (m.threadCount || currentReplies.length) + 1,
                threadLastReplyAt: data.reply.timestamp,
              };
            }
            return m;
          }),
        };
      });
      saveThreadReply(data.channelId, data.parentMessageId, data.reply).catch((err) =>
        console.warn('Sync thread reply to Firestore:', err)
      );
      if (!isDNDActive) {
        playSound('message_receive');
      }
    };

    const handleVoiceRoomsStatus = (status: Record<string, VoiceParticipant[]>) => {
      setVoiceRoomsStatus(status);
    };

    socket.on('chat:new-message', handleNewMessage);
    socket.on('dm:new-message', handleNewDM);
    socket.on('chat:user-typing', handleUserTyping);
    socket.on('chat:reaction-updated', handleReactionUpdated);
    socket.on('chat:message-edited', handleMessageEdited);
    socket.on('chat:history-cleared', handleHistoryCleared);
    socket.on('chat:thread-reply-added', handleThreadReplyAdded);
    socket.on('voice:rooms-status', handleVoiceRoomsStatus);

    return () => {
      socket.off('chat:new-message', handleNewMessage);
      socket.off('dm:new-message', handleNewDM);
      socket.off('chat:user-typing', handleUserTyping);
      socket.off('chat:reaction-updated', handleReactionUpdated);
      socket.off('chat:message-edited', handleMessageEdited);
      socket.off('chat:history-cleared', handleHistoryCleared);
      socket.off('chat:thread-reply-added', handleThreadReplyAdded);
      socket.off('voice:rooms-status', handleVoiceRoomsStatus);
    };
  }, [activeChannel, isDNDActive, currentUser, channelsByServer, servers]);

  // Ações de Envio de Mensagem no Servidor
  const handleSendMessage = useCallback(
    (content: string, attachments?: any[]) => {
      if (!activeChannel || !currentUser) return;

      const socket = getSocket();
      socket.emit('chat:send-message', {
        channelId: activeChannel.id,
        content,
        author: currentUser,
        attachments,
      });
      playSound('message_send');
    },
    [activeChannel, currentUser]
  );

  // Ações de Envio de Resposta em Thread
  const handleSendThreadReply = useCallback(
    (parentMessageId: string, content: string, attachments?: any[]) => {
      if (!activeChannel || !currentUser) {
        setShowAuthModal(true);
        return;
      }

      const socket = getSocket();
      socket.emit('chat:send-thread-reply', {
        channelId: activeChannel.id,
        parentMessageId,
        content,
        author: currentUser,
        attachments,
      });
      playSound('message_send');
    },
    [activeChannel, currentUser]
  );

  // Ações de Envio de Mensagem Privada (DM)
  const handleSendDMMessage = useCallback(
    (targetUserId: string, content: string, attachments?: any[]) => {
      if (!currentUser) return;

      const newMsg: Message = {
        id: `dm-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channelId: `dm-${targetUserId}`,
        content,
        author: currentUser,
        timestamp: new Date().toISOString(),
        reactions: [],
        attachments: attachments || [],
      };

      setDmHistory((prev) => ({
        ...prev,
        [targetUserId]: [...(prev[targetUserId] || []), newMsg],
      }));

      // Emissão via WebSocket para sincronização instantânea de DMs
      const socket = getSocket();
      socket.emit('dm:send-message', {
        recipientId: targetUserId,
        content,
        author: currentUser,
        attachments,
      });

      playSound('message_send');
    },
    [currentUser]
  );

  const handleAddReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!activeChannel || !currentUser) {
        setShowAuthModal(true);
        return;
      }

      const socket = getSocket();
      socket.emit('chat:add-reaction', {
        channelId: activeChannel.id,
        messageId,
        emoji,
        userId: currentUser.id,
      });
    },
    [activeChannel, currentUser]
  );

  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      if (!activeChannel || !currentUser) {
        setShowAuthModal(true);
        return;
      }

      const socket = getSocket();
      socket.emit('chat:edit-message', {
        channelId: activeChannel.id,
        messageId,
        content,
        userId: currentUser.id,
      });
    },
    [activeChannel, currentUser]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeChannel || !currentUser) return;

      const socket = getSocket();
      socket.emit('chat:typing', {
        channelId: activeChannel.id,
        username: currentUser.username,
        isTyping,
      });
    },
    [activeChannel, currentUser]
  );

  const handleClearHistory = useCallback(
    async (channelId: string) => {
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }

      if (currentUser.role !== 'admin') {
        return;
      }

      // Emissão via Socket.IO para sincronização instantânea em tempo real de todos os clientes
      const socket = getSocket();
      socket.emit('chat:clear-history', {
        channelId,
        user: currentUser,
      });

      // Chamada à API REST para persistência consistente no backend
      try {
        await api.clearChannelMessages(channelId);
      } catch (err) {
        console.warn('Fallback de limpeza via REST dispensado ou já processado pelo socket:', err);
      }

      // Atualização otimista imediata do estado local
      setMessagesByChannel((prev) => ({
        ...prev,
        [channelId]: [],
      }));
    },
    [currentUser]
  );

  // Ações de Servidor
  const handleSelectServer = (serverId: string) => {
    setActiveServerId(serverId);
    if (serverId === 'home' || serverId === 'discover') {
      return;
    }

    const serverChannels = channelsByServer[serverId] || [];
    const textChan = serverChannels.find((c) => c.type === 'text') || serverChannels[0];
    if (textChan) {
      setActiveChannel(textChan);
      setViewMode('chat');
    }
  };

  const handleCreateServer = (serverData: Partial<ServerGuild>) => {
    const newServerId = `guild-${Date.now()}`;
    const newServer: ServerGuild = {
      id: newServerId,
      name: serverData.name || 'Novo Servidor Quântico',
      acronym: serverData.acronym || 'SRV',
      iconUrl: serverData.iconUrl,
      description: serverData.description,
      memberCount: 1,
    };

    const initialServerChannels: Channel[] = [
      { id: `c-${Date.now()}-1`, name: 'geral', type: 'text', serverId: newServerId, position: 0 },
      { id: `c-${Date.now()}-2`, name: 'anuncios', type: 'text', serverId: newServerId, position: 1 },
      { id: `c-${Date.now()}-3`, name: 'Palco de Voz', type: 'voice', serverId: newServerId, position: 2 },
    ];

    setServers((prev) => [...prev, newServer]);
    setChannelsByServer((prev) => ({ ...prev, [newServerId]: initialServerChannels }));
    setActiveServerId(newServerId);
    setActiveChannel(initialServerChannels[0]);
    setViewMode('chat');
    playSound('join_voice');
    saveServer(newServer).catch((err) => console.warn('Sync server to Firestore:', err));
    initialServerChannels.forEach((c) => saveChannel(c).catch(() => {}));
  };

  const handleJoinPublicServer = (server: ServerGuild) => {
    if (!servers.some((s) => s.id === server.id)) {
      setServers((prev) => [...prev, server]);
      setChannelsByServer((prev) => ({
        ...prev,
        [server.id]: [
          { id: `c-${server.id}-1`, name: 'geral', type: 'text', serverId: server.id, position: 0 },
          { id: `c-${server.id}-2`, name: 'bate-papo', type: 'text', serverId: server.id, position: 1 },
          { id: `c-${server.id}-3`, name: 'Frequência Coletiva', type: 'voice', serverId: server.id, position: 2 },
        ],
      }));
    }
    handleSelectServer(server.id);
  };

  const handleCreateChannel = (channelData: Partial<Channel>) => {
    if (!channelData.name) return;

    const newChannel: Channel = {
      id: `c-${Date.now()}`,
      name: channelData.name,
      type: channelData.type || 'text',
      category: channelData.category || (channelData.type === 'focus' ? 'CANAIS DE FOCO' : channelData.type === 'voice' ? 'CANAIS DE VOZ' : 'CANAIS DE TEXTO'),
      topic: channelData.topic,
      serverId: activeServerId,
      position: 99,
    };

    setChannelsByServer((prev) => {
      const currentList = prev[activeServerId] || [];
      return {
        ...prev,
        [activeServerId]: [...currentList, newChannel],
      };
    });

    saveChannel(newChannel).catch((err) => console.warn('Sync channel to Firestore:', err));

    if (newChannel.type === 'text') {
      setActiveChannel(newChannel);
      setViewMode('chat');
    } else if (newChannel.type === 'focus') {
      setActiveChannel(newChannel);
      setViewMode('focus' as any);
    } else {
      handleJoinVoiceChannel(newChannel);
    }
  };

  const handleUpdateCurrentServer = (updated: Partial<ServerGuild>) => {
    const targetId = targetSettingsServer?.id || activeServerId;
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === targetId) {
          const updatedServer = { ...s, ...updated };
          saveServer(updatedServer).catch((err) => console.warn('Sync server update to Firestore:', err));
          return updatedServer;
        }
        return s;
      })
    );
  };

  const handleDeleteCurrentServer = (serverId: string) => {
    setServers((prev) => prev.filter((s) => s.id !== serverId));
    if (activeServerId === serverId) {
      setActiveServerId('guild-main');
      const mainChannels = channelsByServer['guild-main'] || [];
      if (mainChannels.length > 0) setActiveChannel(mainChannels[0]);
    }
    if (targetSettingsServer?.id === serverId) {
      setTargetSettingsServer(null);
      setShowServerSettingsModal(false);
    }
    playSound('leave_voice');
  };

  const handleMarkServerAsRead = (serverId: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, mentionCount: 0, unread: false } : s))
    );
  };

  // Ações de Voz / Vídeo
  const handleJoinVoiceChannel = (channel: Channel) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setActiveVoiceChannel(channel);
    setViewMode('voice');
    playSound('join_voice');
  };

  const handleDisconnectVoice = () => {
    disconnectVoice();
    setActiveVoiceChannel(null);
    playSound('leave_voice');
    if (viewMode === 'voice') {
      setViewMode('chat');
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    if (channel.type === 'voice') {
      handleJoinVoiceChannel(channel);
    } else if (channel.type === 'focus') {
      setActiveChannel(channel);
      setViewMode('focus' as any);
    } else {
      setActiveChannel(channel);
      setViewMode('chat');
    }
  };

  // Ações de Amigos e DMs
  const handleStartDM = (user: User) => {
    setActiveServerId('home');
    setHomeTab(`dm-${user.id}`);
  };

  const handleStartCallWithUser = (user: User) => {
    const directVoiceChannel: Channel = {
      id: `dm-voice-${user.id}`,
      name: `Frequência com ${user.username}`,
      type: 'voice',
      serverId: 'home',
      position: 0,
    };
    handleJoinVoiceChannel(directVoiceChannel);
  };

  const handleAcceptFriendRequest = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId || f.user.id === friendId ? { ...f, relationship: 'friend' as const } : f))
    );
  };

  const handleRejectFriendRequest = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId && f.user.id !== friendId));
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId && f.user.id !== friendId));
  };

  const handleSendFriendRequest = (tag: string) => {
    const parts = tag.split('#');
    const username = parts[0];
    const discriminator = parts[1] || '1234';

    const newFriend: Friend = {
      id: `fr-${Date.now()}`,
      user: {
        id: `usr-${Date.now()}`,
        username,
        discriminator,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'online',
        role: 'member',
      },
      relationship: 'pending_outgoing',
      since: new Date().toISOString(),
    };

    setFriends((prev) => [...prev, newFriend]);
    return true;
  };

  // Atalhos de Teclado Centralizados
  const handleNextChannel = useCallback(() => {
    if (activeServerId === 'home' || activeServerId === 'discover') return;
    const srvChannels = channelsByServer[activeServerId] || [];
    if (srvChannels.length === 0) return;
    const currentIndex = srvChannels.findIndex((c) => c.id === activeChannel?.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % srvChannels.length;
    handleSelectChannel(srvChannels[nextIndex]);
    playSound('select_channel');
  }, [activeServerId, channelsByServer, activeChannel]);

  const handlePrevChannel = useCallback(() => {
    if (activeServerId === 'home' || activeServerId === 'discover') return;
    const srvChannels = channelsByServer[activeServerId] || [];
    if (srvChannels.length === 0) return;
    const currentIndex = srvChannels.findIndex((c) => c.id === activeChannel?.id);
    const prevIndex = currentIndex <= 0 ? srvChannels.length - 1 : currentIndex - 1;
    handleSelectChannel(srvChannels[prevIndex]);
    playSound('select_channel');
  }, [activeServerId, channelsByServer, activeChannel]);

  const handleNextServer = useCallback(() => {
    const curIdx = servers.findIndex((s) => s.id === activeServerId);
    if (curIdx === -1) return;
    const nextIdx = (curIdx + 1) % servers.length;
    handleSelectServer(servers[nextIdx].id);
  }, [servers, activeServerId]);

  const handlePrevServer = useCallback(() => {
    const curIdx = servers.findIndex((s) => s.id === activeServerId);
    if (curIdx === -1) return;
    const prevIdx = (curIdx - 1 + servers.length) % servers.length;
    handleSelectServer(servers[prevIdx].id);
  }, [servers, activeServerId]);

  const {
    shortcuts,
    activeToast,
    isShortcutsModalOpen,
    openShortcutsModal,
    closeShortcutsModal,
  } = useKeyboardShortcuts({
    onToggleMute: toggleMute,
    onToggleDeafen: toggleDeafen,
    onToggleVideo: toggleVideo,
    onToggleScreenShare: toggleScreenShare,
    onNextChannel: handleNextChannel,
    onPrevChannel: handlePrevChannel,
    onNextServer: handleNextServer,
    onPrevServer: handlePrevServer,
    onFocusChatSearch: () => {
      const searchInput = document.getElementById('input-chat-search') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    onOpenUserSettings: () => setShowUserSettingsModal(true),
    onToggleMemberList: () => setShowMemberList((prev) => !prev),
    onCloseModals: () => {
      setShowAuthModal(false);
      setShowSecurityModal(false);
      setShowCreateServerModal(false);
      setShowCreateChannelModal(false);
      setShowInviteModal(false);
      setShowServerSettingsModal(false);
      setShowUserSettingsModal(false);
      setPopoverUser(null);
    },
    isMuted,
    isDeafened,
  });

  const handleUpdateCurrentUser = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await api.updateProfile(updatedData);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setMembers((prev) =>
        prev.map((m) => (m.id === res.user.id ? { ...m, ...res.user } : m))
      );
      syncUserProfile(res.user).catch((err) => console.warn('Sync profile to Firestore:', err));
    } catch (e) {
      console.warn('Atualizando perfil localmente:', e);
      const updated = { ...currentUser, ...updatedData };
      setCurrentUser(updated);
      setMembers((prev) =>
        prev.map((m) => (m.id === currentUser.id ? { ...m, ...updated } : m))
      );
      syncUserProfile(updated).catch((err) => console.warn('Sync profile to Firestore:', err));
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    handleDisconnectVoice();
  };

  // Dados do Servidor Ativo
  const currentServer = servers.find((s) => s.id === activeServerId) || null;
  const currentChannels = channelsByServer[activeServerId] || [];
  const currentMessages = activeChannel ? messagesByChannel[activeChannel.id] || [] : [];

  // Dados de DM Ativa se selecionada
  const activeDMUserId = homeTab.startsWith('dm-') ? homeTab.replace('dm-', '') : null;
  const activeDMFriend = activeDMUserId
    ? friends.find((f) => f.user.id === activeDMUserId)?.user || members.find((m) => m.id === activeDMUserId)
    : null;
  const activeDMMessages = activeDMUserId ? dmHistory[activeDMUserId] || [] : [];

  const themePrimary = currentServer?.theme?.primaryColor || '#06b6d4';
  const themeAccent = currentServer?.theme?.accentColor || '#8b5cf6';
  const themeBg = currentServer?.theme?.appBg || '#04060c';

  // Tela de Carregamento Inicial
  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-[#04060c] flex flex-col items-center justify-center text-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-pulse mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="text-sm font-semibold text-cyan-300 tracking-wide font-mono">Iniciando Discord Quantum...</div>
      </div>
    );
  }

  // Gateway de Autenticação Obrigatória ao Abrir o Site
  if (!currentUser) {
    return (
      <div 
        id="auth-gate-root"
        className="fixed inset-0 h-full w-full overflow-hidden bg-[#04060c] text-slate-100 font-sans antialiased select-none relative flex flex-col items-center justify-center"
      >
        {/* Fundo Atmosférico */}
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none opacity-20 bg-cyan-500" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none opacity-15 bg-purple-600" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <AuthModal
          isOpen={true}
          canClose={false}
          onSuccess={(user) => {
            setCurrentUser(user);
            api.getMembers().then((res) => setMembers(res.members)).catch(() => {});
          }}
        />
      </div>
    );
  }

  return (
    <div 
      id="spatial-app-root"
      style={{ backgroundColor: themeBg }}
      className="fixed inset-0 h-full w-full overflow-hidden text-slate-100 font-sans antialiased select-none relative transition-colors duration-500 flex flex-col"
    >
      {/* 0.1 Transmissão Global de Administrador (Broadcast Banner) */}
      {systemConfig.activeBroadcast?.active && (
        <div
          id="global-admin-broadcast-banner"
          className={`w-full py-2 px-4 text-xs font-bold flex items-center justify-between z-30 transition-all shadow-lg shrink-0 ${
            systemConfig.activeBroadcast.type === 'emergency'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white animate-pulse shadow-red-500/30'
              : systemConfig.activeBroadcast.type === 'maintenance'
              ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white shadow-amber-500/20'
              : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-cyan-500/20'
          }`}
        >
          <div className="flex items-center gap-2.5 max-w-4xl mx-auto w-full">
            <span className="px-2 py-0.5 rounded bg-black/35 text-[10px] uppercase font-mono tracking-wider border border-white/20">
              {systemConfig.activeBroadcast.type === 'emergency' ? '🚨 Emergência' : systemConfig.activeBroadcast.type === 'maintenance' ? '⚠️ Manutenção' : '📢 Comunicado'}
            </span>
            <span className="truncate flex-1">{systemConfig.activeBroadcast.message}</span>
            <span className="text-[10px] opacity-75 font-mono hidden sm:inline">Transmissão Global de Administrador</span>
          </div>
        </div>
      )}

      {/* Bloqueio de Modo de Manutenção (se ativado pelo admin) */}
      {systemConfig.maintenanceMode && currentUser?.role !== 'admin' && (
        <div className="absolute inset-0 z-50 bg-[#0c0d12]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mb-4 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Modo de Manutenção Ativo</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            O servidor está temporariamente bloqueado para atualizações e calibragem do sistema. Apenas administradores autorizados podem acessar no momento.
          </p>
          <button
            onClick={() => {
              setUserSettingsInitialTab('admin');
              setShowUserSettingsModal(true);
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/30 cursor-pointer transition-all hover:scale-105"
          >
            Autenticar no Console de Administrador
          </button>
        </div>
      )}

      {/* Luzes de Fundo Atmosféricas / Efeito Mesh Glow Dinâmico com cores do tema do servidor */}
      <div 
        className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full blur-[130px] pointer-events-none opacity-20 transition-all duration-700" 
        style={{ backgroundColor: themePrimary }}
      />
      <div 
        className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[140px] pointer-events-none opacity-15 transition-all duration-700"
        style={{ backgroundColor: themeAccent }}
      />
      <div 
        className="absolute bottom-[-15%] left-[25%] w-[50vw] h-[35vw] rounded-full blur-[150px] pointer-events-none opacity-15 transition-all duration-700"
        style={{ backgroundColor: themePrimary }}
      />

      {/* Grid Cósmico Sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Container Principal de Ilhas Flutuantes */}
      <div className="relative z-10 flex-1 flex p-2 sm:p-3 md:p-4 gap-2.5 sm:gap-3 md:gap-4 overflow-hidden min-h-0 w-full">
        {/* 1. Spatial Server Dock (Extrema Esquerda) */}
        <ServerSidebar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={handleSelectServer}
          onOpenCreateServer={() => setShowCreateServerModal(true)}
          onOpenDiscover={() => setActiveServerId('discover')}
          onOpenSecurity={() => setShowSecurityModal(true)}
          onOpenServerSettings={(srv) => {
            setTargetSettingsServer(srv);
            setShowServerSettingsModal(true);
          }}
          onDeleteServer={handleDeleteCurrentServer}
          onMarkAsRead={handleMarkServerAsRead}
          onOpenInviteModal={(srv) => {
            setTargetSettingsServer(srv);
            setShowInviteModal(true);
          }}
          onOpenCreateChannel={(srv) => {
            setActiveServerId(srv.id);
            setCreateChannelType('text');
            setShowCreateChannelModal(true);
          }}
        />

        {/* 2. Ilha Secundária: Hub Social (Home) ou Canais do Servidor com Animação Fluida */}
        <AnimatePresence mode="wait">
          {activeServerId === 'home' ? (
            <motion.div
              key="home-sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="h-full flex shrink-0"
            >
              <DirectMessageSidebar
                activeTab={homeTab}
                onSelectTab={(tab) => setHomeTab(tab)}
                friends={friends}
                currentUser={currentUser}
                activeVoiceChannel={activeVoiceChannel}
                isMuted={isMuted}
                isDeafened={isDeafened}
                isVideoOn={isVideoOn}
                isScreenSharing={isScreenSharing}
                onToggleMute={toggleMute}
                onToggleDeafen={toggleDeafen}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onDisconnectVoice={handleDisconnectVoice}
                onReturnToVoice={() => setViewMode('voice')}
                onOpenSettings={() => setShowUserSettingsModal(true)}
                onOpenAuth={() => setShowAuthModal(true)}
                onOpenSecurity={() => setShowSecurityModal(true)}
                onStartNewDM={() => setHomeTab('friends')}
                onOpenShortcutsModal={openShortcutsModal}
              />
            </motion.div>
          ) : activeServerId === 'discover' ? null : (
            <motion.div
              key={`channel-sidebar-${activeServerId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="h-full flex shrink-0"
            >
              <ChannelSidebar
                currentServer={currentServer}
                channels={currentChannels}
                activeChannelId={activeChannel?.id || ''}
                activeVoiceChannelId={activeVoiceChannel?.id || null}
                activeVoiceChannel={activeVoiceChannel}
                currentUser={currentUser}
                voiceRoomsStatus={voiceRoomsStatus}
                isMuted={isMuted}
                isDeafened={isDeafened}
                isVideoOn={isVideoOn}
                isScreenSharing={isScreenSharing}
                onSelectChannel={handleSelectChannel}
                onJoinVoiceChannel={handleJoinVoiceChannel}
                onToggleMute={toggleMute}
                onToggleDeafen={toggleDeafen}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onDisconnectVoice={handleDisconnectVoice}
                onReturnToVoice={() => setViewMode('voice')}
                onOpenAuth={() => setShowAuthModal(true)}
                onLogout={handleLogout}
                onOpenSecurity={() => setShowSecurityModal(true)}
                onOpenCreateChannel={(type) => {
                  setCreateChannelType(type);
                  setShowCreateChannelModal(true);
                }}
                onOpenInviteModal={() => setShowInviteModal(true)}
                onOpenServerSettings={() => setShowServerSettingsModal(true)}
                onOpenUserSettings={() => setShowUserSettingsModal(true)}
                onOpenShortcutsModal={openShortcutsModal}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Ilha Central Principal (Palco de Voz, Chat ou Hub de Amigos) Estável e Sem Deslocamento */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full relative overflow-hidden">
          {/* Caso 3.1: Explorar Comunidades Públicas */}
          {activeServerId === 'discover' ? (
            <DiscoverView
              onJoinServer={handleJoinPublicServer}
              joinedServerIds={servers.map((s) => s.id)}
            />
          ) : activeServerId === 'home' ? (
            /* Caso 3.2: Tela Inicial / Home (Amigos, Nitro ou DM Privada) */
            homeTab === 'nitro' ? (
              <NitroView />
            ) : homeTab.startsWith('dm-') && activeDMFriend ? (
              <DirectMessageChat
                friendUser={activeDMFriend}
                currentUser={currentUser}
                messages={activeDMMessages}
                onSendMessage={(content, attachments) =>
                  handleSendDMMessage(activeDMFriend.id, content, attachments)
                }
                onAddReaction={(msgId, emoji) => {
                  setDmHistory((prev) => {
                    const msgs = prev[activeDMFriend.id] || [];
                    return {
                      ...prev,
                      [activeDMFriend.id]: msgs.map((m) =>
                        m.id === msgId
                          ? {
                              ...m,
                              reactions: [
                                ...(m.reactions || []).filter((r) => r.emoji !== emoji),
                                { emoji, count: 1, users: [currentUser?.id || 'me'] },
                              ],
                            }
                          : m
                      ),
                    };
                  });
                }}
                onStartVoiceCall={handleStartCallWithUser}
                onStartVideoCall={handleStartCallWithUser}
                onOpenProfile={(u) => setPopoverUser(u)}
              />
            ) : (
              <FriendsView
                friends={friends}
                onStartDM={handleStartDM}
                onStartCall={handleStartCallWithUser}
                onAddFriend={handleSendFriendRequest}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                onRejectFriendRequest={handleRejectFriendRequest}
                onRemoveFriend={handleRemoveFriend}
                onSelectUserForProfile={(u) => setPopoverUser(u)}
              />
            )
          ) : viewMode === 'voice' && activeVoiceChannel ? (
            /* Caso 3.3: Holo-Stage de Voz & Vídeo WebRTC */
            <VoiceChannelView
              channel={activeVoiceChannel}
              currentUser={currentUser}
              participants={participants}
              localStream={localStream}
              isMuted={isMuted}
              isDeafened={isDeafened}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              cursorMode={cursorMode}
              isSpeakingLocally={isSpeakingLocally}
              mediaError={mediaError}
              getDiagnostics={getDiagnostics}
              onLogDiagnostics={logDiagnostics}
              onToggleMute={toggleMute}
              onToggleDeafen={toggleDeafen}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={toggleScreenShare}
              onToggleCursorMode={toggleCursorMode}
              onDisconnect={handleDisconnectVoice}
            />
          ) : activeChannel?.type === 'focus' ? (
            /* Caso 3.4: Canal de Foco & Pomodoro Sincronizado */
            <FocusChannelView
              channel={activeChannel}
              currentUser={currentUser}
              focusState={focusState}
              ambientSound={ambientSound}
              ambientVolume={ambientVolume}
              userTask={userTask}
              isDNDActive={isDNDActive}
              onStart={startFocusTimer}
              onPause={pauseFocusTimer}
              onReset={resetFocusTimer}
              onSetMode={setFocusMode}
              onSetTask={setFocusTask}
              onSetAmbient={setFocusAmbient}
              onSetVolume={setFocusVolume}
            />
          ) : activeChannel ? (
            /* Caso 3.5: Chat Quântico do Canal */
            <ChatArea
              channel={activeChannel}
              messages={currentMessages}
              currentUser={currentUser}
              typingUsers={typingUsers}
              showMemberList={showMemberList}
              activeVoiceChannel={activeVoiceChannel}
              isScreenSharing={isScreenSharing}
              isVideoOn={isVideoOn}
              onToggleMemberList={() => setShowMemberList(!showMemberList)}
              onSendMessage={handleSendMessage}
              onSendThreadReply={handleSendThreadReply}
              onEditMessage={handleEditMessage}
              onClearHistory={handleClearHistory}
              onAddReaction={handleAddReaction}
              onTyping={handleTyping}
              onOpenAuth={() => setShowAuthModal(true)}
              onToggleScreenShare={() => {
                if (!activeVoiceChannel) {
                  const defaultVoice = currentChannels.find((c) => c.type === 'voice');
                  if (defaultVoice) {
                    handleJoinVoiceChannel(defaultVoice);
                  }
                }
                toggleScreenShare();
              }}
              onToggleVideo={toggleVideo}
              onOpenVoiceStage={() => setViewMode('voice')}
            />
          ) : (
            <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center text-slate-400 min-h-0 h-full">
              Selecione um canal ou tripulante para iniciar a transmissão
            </div>
          )}

          {/* Barra Flutuante de Voz quando em chamada navegando em outros canais */}
          {activeVoiceChannel && viewMode !== 'voice' && (
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <ActiveVoiceBar
                voiceChannel={activeVoiceChannel}
                isMuted={isMuted}
                isScreenSharing={isScreenSharing}
                onReturnToVoice={() => setViewMode('voice')}
                onDisconnect={handleDisconnectVoice}
              />
            </div>
          )}
        </div>

        {/* 4. Ilha Lateral de Membros (Spatial Roster) com Animação Suave */}
        <AnimatePresence>
          {activeServerId !== 'home' && activeServerId !== 'discover' && activeChannel?.type === 'text' && showMemberList && (
            <motion.div
              key={`member-list-${activeServerId}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2 }}
              className="h-full flex shrink-0"
            >
              <MemberList
                members={members}
                currentUserId={currentUser?.id}
                onSelectMember={(u) => setPopoverUser(u)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- MODAIS COM ESTILO SPATIAL GLASS --- */}

      {/* Popover / Cartão de Perfil de Usuário */}
      <UserProfilePopover
        user={popoverUser}
        isOpen={!!popoverUser}
        onClose={() => setPopoverUser(null)}
        onStartDM={handleStartDM}
        onStartCall={handleStartCallWithUser}
      />

      {/* Modal de Criação de Servidor */}
      <CreateServerModal
        isOpen={showCreateServerModal}
        onClose={() => setShowCreateServerModal(false)}
        onCreateServer={handleCreateServer}
      />

      {/* Modal de Criação de Canal */}
      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        defaultType={createChannelType}
        onCreateChannel={handleCreateChannel}
      />

      {/* Modal de Convite para o Servidor */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setTargetSettingsServer(null);
        }}
        server={targetSettingsServer || currentServer}
        friends={friends}
      />

      {/* Modal de Configurações do Servidor */}
      <ServerSettingsModal
        isOpen={showServerSettingsModal}
        onClose={() => {
          setShowServerSettingsModal(false);
          setTargetSettingsServer(null);
        }}
        server={targetSettingsServer || currentServer}
        onUpdateServer={handleUpdateCurrentServer}
        onDeleteServer={handleDeleteCurrentServer}
      />

      {/* Modal de Configurações do Usuário & Console Admin Secreto */}
      <UserSettingsModal
        isOpen={showUserSettingsModal}
        onClose={() => {
          setShowUserSettingsModal(false);
          setUserSettingsInitialTab('account');
        }}
        currentUser={currentUser}
        onUpdateUser={handleUpdateCurrentUser}
        onLogout={handleLogout}
        onOpenSecurityDiagnosis={() => setShowSecurityModal(true)}
        onOpenShortcutsModal={openShortcutsModal}
        allUsers={members}
        allServers={servers}
        onUpdateTargetUser={handleUpdateTargetMember}
        onUpdateServer={handleUpdateCurrentServer}
        onDeleteServer={handleDeleteCurrentServer}
        systemConfig={systemConfig}
        onUpdateSystemConfig={(patch) => setSystemConfig((prev) => ({ ...prev, ...patch }))}
        initialTab={userSettingsInitialTab}
      />

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          api.getMembers().then((res) => setMembers(res.members));
        }}
      />

      {/* Modal de Diagnóstico de Segurança & Backend Express */}
      <SecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      {/* Central de Atalhos de Teclado */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={closeShortcutsModal}
        shortcuts={shortcuts}
      />

      {/* Toast Notificador de Atalhos Acionados */}
      {activeToast && (
        <div
          id="shortcut-toast-banner"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#111214]/95 border border-[#3f4147] shadow-2xl backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="p-1.5 rounded-lg bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30">
            {activeToast.iconType === 'mic' ? (
              <Mic className="w-4 h-4" />
            ) : activeToast.iconType === 'headphones' ? (
              <Headphones className="w-4 h-4" />
            ) : (
              <Keyboard className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{activeToast.title}</span>
              <div className="flex items-center gap-1">
                {activeToast.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="text-[10px] font-mono font-bold bg-[#1e1f22] text-[#5865f2] px-1.5 py-0.5 rounded border border-[#3f4147]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
            {activeToast.description && (
              <p className="text-[11px] text-[#949ba4] mt-0.5">{activeToast.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
