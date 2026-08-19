import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Bell,
  Pin,
  Users,
  Search,
  PlusCircle,
  Smile,
  Send,
  Sparkles,
  Paperclip,
  X,
  MonitorUp,
  Video,
  Volume2,
  ExternalLink,
  PinOff,
  Pencil,
  Check,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  CornerDownRight,
} from 'lucide-react';
import { Channel, Message, User } from '../../types';
import { ThreadSidePanel } from './ThreadSidePanel';

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  currentUser: User | null;
  typingUsers: string[];
  showMemberList: boolean;
  activeVoiceChannel?: Channel | null;
  isScreenSharing?: boolean;
  isVideoOn?: boolean;
  onToggleMemberList: () => void;
  onSendMessage: (content: string, attachments?: any[]) => void;
  onSendThreadReply?: (parentMessageId: string, content: string, attachments?: any[]) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onClearHistory?: (channelId: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
  onOpenAuth: () => void;
  onToggleScreenShare?: () => void;
  onToggleVideo?: () => void;
  onOpenVoiceStage?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🔥', '😂', '🎉', '👀', '💯'];

// Helper para destacar termos pesquisados com segurança e case-insensitive
export const highlightMatches = (text: string, query: string) => {
  if (!query || !query.trim()) return text;

  try {
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-cyan-500/35 text-cyan-100 font-bold px-1 py-0.5 rounded-md border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] selection:bg-cyan-400 selection:text-black"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  messages,
  currentUser,
  typingUsers,
  showMemberList,
  activeVoiceChannel,
  isScreenSharing = false,
  isVideoOn = false,
  onToggleMemberList,
  onSendMessage,
  onSendThreadReply,
  onEditMessage,
  onClearHistory,
  onAddReaction,
  onTyping,
  onOpenAuth,
  onToggleScreenShare,
  onToggleVideo,
  onOpenVoiceStage,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  // Estado de Tópico / Thread Ativa
  const [activeThreadMessage, setActiveThreadMessage] = useState<Message | null>(null);

  // Estado de Edição de Mensagem
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Estado de Limpeza de Histórico (Admin Only)
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearNotification, setClearNotification] = useState<string | null>(null);

  // Estado de Mensagens Fixadas (Pinned Messages) & Drawer
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>(() =>
    messages.filter((m) => m.isPinned)
  );
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Sincronização da mensagem do tópico com o histórico atualizado
  useEffect(() => {
    if (activeThreadMessage) {
      const freshParent = messages.find((m) => m.id === activeThreadMessage.id);
      if (freshParent) {
        setActiveThreadMessage(freshParent);
      }
    }
  }, [messages]);

  // Listener global de atalho (Ctrl+F / Cmd+F) para focar na barra de busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'Escape' && showClearConfirmModal) {
        setShowClearConfirmModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showClearConfirmModal]);

  // Scroll suave contido exclusivamente no contêiner de mensagens sem mover a janela
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Sincronização e persistência de mensagens fixadas ao atualizar lista
  useEffect(() => {
    setPinnedMessages((prev) => {
      const map = new Map<string, Message>();
      messages.filter((m) => m.isPinned).forEach((m) => map.set(m.id, m));
      prev.forEach((m) => {
        const fresh = messages.find((msg) => msg.id === m.id) || m;
        map.set(m.id, fresh);
      });
      return Array.from(map.values());
    });
  }, [messages]);

  const handleConfirmClearHistory = async () => {
    if (!isAdmin || !onClearHistory) return;
    setIsClearing(true);
    try {
      await onClearHistory(channel.id);
      setPinnedMessages([]);
      setShowClearConfirmModal(false);
      setClearNotification(`O histórico de #${channel.name} foi totalmente limpo e sincronizado.`);
      setTimeout(() => {
        setClearNotification(null);
      }, 5000);
    } catch (err) {
      console.error('Erro ao executar limpeza de histórico:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = (msg: Message) => {
    const trimmed = editingContent.trim();
    if (!trimmed) return;
    if (trimmed !== msg.content && onEditMessage) {
      onEditMessage(msg.id, trimmed);
    }
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleTogglePin = (targetMsg: Message) => {
    setPinnedMessages((prev) => {
      const isAlreadyPinned = prev.some((m) => m.id === targetMsg.id);
      if (isAlreadyPinned) {
        return prev.filter((m) => m.id !== targetMsg.id);
      } else {
        return [{ ...targetMsg, isPinned: true }, ...prev];
      }
    });
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-amber-400', 'bg-amber-500/15');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/15');
      }, 2500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (currentUser) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!inputText.trim() && !attachedFile) return;

    const attachments = attachedFile
      ? [
          {
            id: `att-${Date.now()}`,
            url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
            name: attachedFile.name,
            size: 1024 * 140,
            type: 'image' as const,
          },
        ]
      : [];

    onSendMessage(inputText, attachments);
    setInputText('');
    setAttachedFile(null);
    setShowEmojiPicker(false);
    onTyping(false);
  };

  const handleSimulateAttachment = () => {
    setAttachedFile({
      name: `spatial_matrix_render_${Math.floor(Math.random() * 90 + 10)}.png`,
      size: '1.4 MB',
      type: 'image/png',
    });
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div
      id="chat-area"
      className="flex-1 glass-panel rounded-2xl flex flex-row relative overflow-hidden select-none border border-white/10 shadow-xl h-full min-h-0 min-w-0"
    >
      {/* Coluna Principal do Chat */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden relative">
        {/* Topo do Canal (Header Spatial) */}
        <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between shrink-0 bg-white/[0.02] backdrop-blur-xl z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-bold text-sm tracking-wide text-white truncate">
            {channel.name}
          </h2>
          <div className="w-[1px] h-3.5 bg-white/15 mx-1 hidden sm:block" />
          <span className="text-xs text-slate-400 truncate hidden md:block max-w-xs">
            {channel.topic || 'Canal de comunicação e transmissão de dados'}
          </span>
        </div>

        {/* Ferramentas do Header */}
        <div className="flex items-center gap-1.5 text-slate-400">
          {/* Botão de Transmissão de Tela no Topo */}
          {onToggleScreenShare && (
            <button
              id="btn-header-screenshare"
              onClick={onToggleScreenShare}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isScreenSharing
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300/40 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              }`}
              title="Transmitir sua tela ao vivo"
            >
              <MonitorUp className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">{isScreenSharing ? 'Ao Vivo' : 'Transmitir Tela'}</span>
            </button>
          )}

          {/* Atalho para Palco de Voz */}
          {activeVoiceChannel && onOpenVoiceStage && (
            <button
              onClick={onOpenVoiceStage}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
              title="Ver Sala de Voz"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Voz</span>
            </button>
          )}

          {/* Busca Holográfica no Top Navigation */}
          <div className="relative flex items-center">
            <div className={`relative flex items-center transition-all duration-200 ${searchQuery ? 'w-48 sm:w-60' : 'w-32 sm:w-44 focus-within:w-48 sm:focus-within:w-60'}`}>
              <input
                ref={searchInputRef}
                id="input-chat-search"
                type="text"
                placeholder="Buscar... (Ctrl+F)"
                title="Buscar mensagens no canal (Ctrl+F ou ⌘F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                className={`w-full bg-slate-900/80 border rounded-full px-3 py-1 pl-8 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  searchQuery
                    ? 'border-cyan-400/80 ring-2 ring-cyan-500/30 pr-16 bg-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'border-white/15 hover:border-white/25 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/20'
                }`}
              />
              <Search className={`w-3.5 h-3.5 absolute left-2.5 transition-colors pointer-events-none ${searchQuery ? 'text-cyan-400' : 'text-slate-400'}`} />

              {searchQuery && (
                <div className="absolute right-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-800/60 leading-none">
                    {filteredMessages.length}
                  </span>
                  <button
                    id="btn-clear-chat-search"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    title="Limpar busca (ESC)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Mensagens Fixadas no Topo */}
          <button
            id="btn-toggle-pinned-messages"
            onClick={() => setShowPinnedDrawer(!showPinnedDrawer)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
              showPinnedDrawer
                ? 'text-amber-400 border border-amber-400/40 bg-amber-500/15 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
            }`}
            title={`Mensagens Fixadas (${pinnedMessages.length})`}
          >
            <Pin className={`w-4 h-4 ${pinnedMessages.length > 0 ? 'text-amber-400 fill-amber-400/20' : ''}`} />
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center shadow-md">
                {pinnedMessages.length}
              </span>
            )}
          </button>

          {/* Botão de Limpar Histórico do Canal (Apenas Administradores) */}
          {isAdmin && (
            <button
              id="btn-clear-channel-history"
              onClick={() => setShowClearConfirmModal(true)}
              className="p-1.5 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 group"
              title="Limpar histórico de mensagens do canal (Admin)"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-rose-400" />
            </button>
          )}

          <button
            onClick={onToggleMemberList}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showMemberList ? 'text-cyan-400 border border-cyan-400/40 bg-white/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Alternar Lista de Tripulantes"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notificação de Histórico Limpo */}
      {clearNotification && (
        <div
          id="banner-history-cleared"
          className="bg-rose-950/70 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs text-rose-200 backdrop-blur-md shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{clearNotification}</span>
          </div>
          <button
            onClick={() => setClearNotification(null)}
            className="text-rose-400 hover:text-white p-0.5 rounded cursor-pointer"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Indicador de Filtro Ativo quando há busca */}
      {searchQuery && (
        <div className="bg-cyan-950/40 border-b border-cyan-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-cyan-300/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Filtrando por <strong className="text-white font-mono bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700/50">"{searchQuery}"</strong>
            </span>
            <span className="text-cyan-400/70 font-mono text-[11px]">
              • {filteredMessages.length} {filteredMessages.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-cyan-300 hover:text-white font-semibold underline underline-offset-2 cursor-pointer"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Lista de Mensagens com Scroll Suave */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 scrollbar-thin"
      >
        {/* Banner de Boas-Vindas ao Canal (oculto durante busca) */}
        {!searchQuery && (
          <div className="my-6 p-5 glass-dock rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-3 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Hash className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white tracking-wide">
              Bem-vindo ao #{channel.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Este é o ponto de encontro do canal #{channel.name}. Troque mensagens em tempo real, compartilhe dados e acione frequências WebRTC.
            </p>
          </div>
        )}

        {/* Empty State para Busca sem resultados */}
        {searchQuery && filteredMessages.length === 0 && (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Search className="w-7 h-7 text-cyan-400/80" />
            </div>
            <h4 className="text-base font-bold text-white">Nenhum resultado encontrado</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Não encontramos nenhuma mensagem contendo <strong className="text-cyan-300">"{searchQuery}"</strong> no canal #{channel.name}.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-all cursor-pointer"
            >
              Restaurar todas as mensagens
            </button>
          </div>
        )}

        {/* Mensagens */}
        {filteredMessages.map((msg) => {
          const isMe = currentUser?.id === msg.author.id;
          const isPinned = pinnedMessages.some((p) => p.id === msg.id);
          const canEdit = Boolean(currentUser && (currentUser.id === msg.author.id || currentUser.role === 'admin'));
          const isEditing = editingMessageId === msg.id;
          const isThreadActive = activeThreadMessage?.id === msg.id;
          const hasThread = (msg.threadReplies && msg.threadReplies.length > 0) || (Boolean(msg.threadCount && msg.threadCount > 0));

          return (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`group flex gap-3.5 p-2.5 rounded-2xl transition-all duration-200 relative ${
                isThreadActive
                  ? 'bg-cyan-950/25 border border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.18)]'
                  : isPinned
                  ? 'bg-amber-500/[0.07] border border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                  : 'hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {/* Badge de Mensagem Fixada */}
              {isPinned && (
                <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] text-amber-400 font-bold font-mono bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/30 shadow-sm pointer-events-none">
                  <Pin className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>Fixada</span>
                </div>
              )}

              <img
                src={msg.author.avatarUrl}
                alt={msg.author.username}
                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10 shrink-0 mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-extrabold tracking-wide ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                    {msg.author.username}
                  </span>
                  {msg.author.role === 'admin' && (
                    <span className="text-[9px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(139,92,246,0.4)]">
                      Admin
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.edited && (
                    <span
                      className="text-[10px] text-slate-400 font-mono italic opacity-75 select-none"
                      title="Esta mensagem foi editada"
                    >
                      (editado)
                    </span>
                  )}
                </div>

                {isEditing ? (
                  /* Modo de Edição Inline */
                  <div className="mt-2 w-full glass-dock p-3 rounded-2xl border border-cyan-500/50 bg-slate-950/90 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <textarea
                      id={`input-edit-message-${msg.id}`}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit(msg);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleCancelEdit();
                        }
                      }}
                      rows={2}
                      className="w-full bg-transparent text-slate-100 text-sm focus:outline-none resize-none placeholder-slate-500 font-normal leading-relaxed"
                      placeholder="Edite sua transmissão..."
                      autoFocus
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10 text-xs">
                      <span className="text-[11px] text-slate-400">
                        esc para{' '}
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-rose-400 hover:underline cursor-pointer"
                        >
                          cancelar
                        </button>{' '}
                        • enter para{' '}
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(msg)}
                          className="text-cyan-300 hover:underline font-semibold cursor-pointer"
                        >
                          salvar
                        </button>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-cancel-edit-${msg.id}`}
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          id={`btn-save-edit-${msg.id}`}
                          type="button"
                          disabled={!editingContent.trim()}
                          onClick={() => handleSaveEdit(msg)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            editingContent.trim()
                              ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95'
                              : 'text-slate-500 bg-white/5 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-200 text-[14px] mt-1 break-words leading-relaxed font-normal">
                    {highlightMatches(msg.content, searchQuery)}
                  </p>
                )}

                {/* Anexos de imagem / arquivos */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="rounded-2xl overflow-hidden border border-white/10 max-w-sm shadow-xl"
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-auto object-cover max-h-60 rounded-2xl"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Badge de Resumo da Thread / Respostas */}
                {hasThread && (
                  <button
                    id={`btn-open-thread-badge-${msg.id}`}
                    onClick={() => setActiveThreadMessage(msg)}
                    className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-xs cursor-pointer shadow-sm group/thread w-fit"
                    title="Abrir painel de respostas do tópico"
                  >
                    <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                      {msg.threadReplies && msg.threadReplies.length > 0 ? (
                        msg.threadReplies.slice(0, 3).map((r, i) => (
                          <img
                            key={i}
                            src={r.author.avatarUrl}
                            alt={r.author.username}
                            className="inline-block w-4 h-4 rounded-full ring-1 ring-slate-900 object-cover"
                          />
                        ))
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-bold">
                          #
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-cyan-300 group-hover/thread:underline flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {msg.threadReplies?.length || msg.threadCount}{' '}
                        {(msg.threadReplies?.length || msg.threadCount) === 1 ? 'resposta' : 'respostas'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <span>Ver tópico</span>
                      <CornerDownRight className="w-2.5 h-2.5 text-cyan-400" />
                    </span>
                  </button>
                )}

                {/* Reações e Ações com Emojis */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {msg.reactions?.map((react, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddReaction(msg.id, react.emoji)}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold glass-dock hover:border-cyan-400/40 flex items-center gap-1 transition-all cursor-pointer border border-white/10"
                    >
                      <span>{react.emoji}</span>
                      <span className="text-[10px] text-cyan-300">{react.count}</span>
                    </button>
                  ))}

                  {/* Ações no Hover: Responder na Thread, Fixar, Editar e Emojis Rápidos */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {/* Botão de Responder na Thread */}
                    <button
                      id={`btn-reply-thread-${msg.id}`}
                      onClick={() => setActiveThreadMessage(msg)}
                      className="p-1.5 rounded-xl transition-all cursor-pointer glass-dock text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40"
                      title="Responder em Thread / Abrir Tópico"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão de Fixar/Desafixar Mensagem */}
                    <button
                      id={`btn-pin-msg-${msg.id}`}
                      onClick={() => handleTogglePin(msg)}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        isPinned
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : 'glass-dock text-slate-400 hover:text-amber-300 hover:border-amber-400/40'
                      }`}
                      title={isPinned ? 'Desafixar mensagem' : 'Fixar mensagem'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    {/* Botão de Editar Mensagem (para autor ou admin) */}
                    {canEdit && (
                      <button
                        id={`btn-edit-msg-${msg.id}`}
                        onClick={() => handleStartEdit(msg)}
                        className="p-1.5 rounded-xl transition-all cursor-pointer glass-dock text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40"
                        title="Editar mensagem"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onAddReaction(msg.id, emoji)}
                        className="w-6 h-6 rounded-lg glass-dock flex items-center justify-center text-xs hover:scale-115 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Indicador de Digitação */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-xs text-cyan-400/90 flex items-center gap-2 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está transmitindo...' : 'estão transmitindo...'}
          </span>
        </div>
      )}

      {/* Caixa de Entrada de Mensagem em Cápsula Spatial */}
      <div className="p-4 bg-white/[0.01] shrink-0 border-t border-white/10">
        {attachedFile && (
          <div className="mb-2 glass-dock p-2.5 rounded-2xl flex items-center justify-between border border-cyan-500/30">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Paperclip className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold truncate max-w-xs">{attachedFile.name}</span>
              <span className="text-[10px] text-slate-500">({attachedFile.size})</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleFormSubmit}
          className="glass-dock rounded-2xl p-1.5 flex items-center gap-2 border border-white/15 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all shadow-xl"
        >
          <button
            type="button"
            onClick={handleSimulateAttachment}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
            title="Anexar Dados"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Conversar em #${channel.name}...`}
            className="flex-1 bg-transparent text-slate-200 text-[14px] placeholder-slate-500 focus:outline-none px-2 py-1"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 glass-dock p-2.5 rounded-2xl shadow-2xl border border-white/20 grid grid-cols-4 gap-1.5 z-30 animate-in fade-in zoom-in-95">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg hover:scale-115 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() && !attachedFile}
            className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer ${
              inputText.trim() || attachedFile
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95'
                : 'text-slate-600 bg-white/5 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>

      {/* Painel Lateral de Tópico / Thread */}
      {activeThreadMessage && (
        <ThreadSidePanel
          parentMessage={activeThreadMessage}
          channelName={channel.name}
          currentUser={currentUser}
          onClose={() => setActiveThreadMessage(null)}
          onSendReply={(parentMsgId, content, attachments) => {
            if (onSendThreadReply) {
              onSendThreadReply(parentMsgId, content, attachments);
            }
          }}
          onAddReaction={onAddReaction}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* Drawer / Painel Lateral de Mensagens Fixadas */}
      {showPinnedDrawer && (
        <div
          id="pinned-messages-drawer"
          className="absolute inset-y-0 right-0 w-full sm:w-80 md:w-96 glass-dock bg-slate-950/95 backdrop-blur-2xl border-l border-white/15 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Cabeçalho do Drawer */}
          <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                <Pin className="w-4 h-4 fill-amber-400/30" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                  Mensagens Fixadas
                  <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                    {pinnedMessages.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  #{channel.name}
                </p>
              </div>
            </div>

            <button
              id="btn-close-pinned-drawer"
              onClick={() => setShowPinnedDrawer(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo do Drawer */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {pinnedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                  <Pin className="w-8 h-8 text-amber-400/80" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Nenhuma mensagem fixada</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Passe o cursor sobre qualquer mensagem e clique no ícone de alfinete para salvá-la aqui para acesso rápido.
                </p>
              </div>
            ) : (
              pinnedMessages.map((pinnedMsg) => (
                <div
                  key={pinnedMsg.id}
                  id={`pinned-card-${pinnedMsg.id}`}
                  className="glass-dock p-3.5 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all group relative bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={pinnedMsg.author.avatarUrl}
                        alt={pinnedMsg.author.username}
                        className="w-7 h-7 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <span className="text-xs font-bold text-white">
                        {pinnedMsg.author.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(pinnedMsg.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {pinnedMsg.edited && (
                        <span className="text-[9px] text-slate-400 font-mono italic opacity-75">
                          (editado)
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed break-words font-normal mb-2.5">
                    {pinnedMsg.content}
                  </p>

                  {/* Anexos na mensagem fixada */}
                  {pinnedMsg.attachments && pinnedMsg.attachments.length > 0 && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-white/10 max-h-32">
                      <img
                        src={pinnedMsg.attachments[0].url}
                        alt={pinnedMsg.attachments[0].name}
                        className="w-full h-auto object-cover max-h-32 rounded-xl"
                      />
                    </div>
                  )}

                  {/* Ações da Mensagem Fixada */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <button
                      onClick={() => {
                        scrollToMessage(pinnedMsg.id);
                        if (window.innerWidth < 640) {
                          setShowPinnedDrawer(false);
                        }
                      }}
                      className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                      title="Pular para mensagem no chat"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ir para mensagem</span>
                    </button>

                    <button
                      onClick={() => handleTogglePin(pinnedMsg)}
                      className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                      title="Desafixar mensagem"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Desafixar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Limpeza de Histórico (Admin) */}
      {showClearConfirmModal && (
        <div
          id="modal-clear-history-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isClearing) {
              setShowClearConfirmModal(false);
            }
          }}
        >
          <div
            id="modal-clear-history"
            className="w-full max-w-md glass-panel bg-slate-950/95 border border-rose-500/30 rounded-3xl p-6 shadow-2xl shadow-rose-950/50 relative overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Glow de fundo */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    Limpar Histórico do Canal
                  </h3>
                  <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-rose-300/80 font-mono mt-0.5">
                  #{channel.name}
                </p>
              </div>
              <button
                id="btn-close-clear-modal"
                disabled={isClearing}
                onClick={() => setShowClearConfirmModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed mb-6 bg-white/[0.02] p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Atenção: Ação permanente e irreversível</span>
              </div>
              <p>
                Você está prestes a apagar todas as <strong className="text-white">{messages.length} mensagens</strong> transmitidas no canal <strong className="text-cyan-300">#{channel.name}</strong>.
              </p>
              <p className="text-slate-400 text-[11px]">
                Um evento de exclusão será transmitido instantaneamente via Socket.io sincronizando todos os tripulantes conectados.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                id="btn-cancel-clear-history"
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-clear-history"
                type="button"
                disabled={isClearing}
                onClick={handleConfirmClearHistory}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Limpando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Tudo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
