import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  PlusCircle,
  Smile,
  Send,
  Paperclip,
  X,
  Lock,
} from 'lucide-react';
import { User, Message } from '../../types';
import { playSound } from '../../utils/soundEffects';
import { highlightMatches } from './ChatArea';

interface DirectMessageChatProps {
  friendUser: User;
  currentUser: User | null;
  messages: Message[];
  onSendMessage: (content: string, attachments?: any[]) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onStartVoiceCall: (user: User) => void;
  onStartVideoCall: (user: User) => void;
  onOpenProfile: (user: User) => void;
}

const QUICK_EMOJIS = ['❤️', '👍', '🔥', '😂', '🎉', '👀', '✨', '💯'];

export const DirectMessageChat: React.FC<DirectMessageChatProps> = ({
  friendUser,
  currentUser,
  messages,
  onSendMessage,
  onAddReaction,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const attachments = attachedFile
      ? [
          {
            id: `att-${Date.now()}`,
            url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
            name: attachedFile.name,
            size: 1024 * 80,
            type: 'image' as const,
          },
        ]
      : [];

    onSendMessage(inputText, attachments);
    playSound('message_send');
    setInputText('');
    setAttachedFile(null);
    setShowEmojiPicker(false);
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main 
      id="dm-chat-area" 
      className="flex-1 glass-panel rounded-2xl flex flex-col min-w-0 min-h-0 h-full relative overflow-hidden select-none border border-white/10 shadow-xl"
    >
      {/* Cabeçalho da DM Spatial */}
      <div 
        id="dm-header"
        className="h-16 border-b border-white/10 px-5 flex items-center justify-between shrink-0 bg-white/[0.02] backdrop-blur-xl z-10"
      >
        <div 
          onClick={() => onOpenProfile(friendUser)}
          className="flex items-center gap-3 min-w-0 cursor-pointer p-1.5 rounded-2xl hover:bg-white/[0.06] transition-all group"
          title="Ver perfil quântico"
        >
          <div className="relative shrink-0">
            <img
              src={friendUser.avatarUrl}
              alt={friendUser.username}
              className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/20 group-hover:ring-cyan-400 transition-all"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                friendUser.status === 'online'
                  ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                  : friendUser.status === 'idle'
                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  : friendUser.status === 'dnd'
                  ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-[15px] group-hover:text-cyan-300 transition-colors truncate">
                {friendUser.username}
              </span>
              <span className="text-[11px] text-cyan-400/80 font-mono">
                #{friendUser.discriminator}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Canal P2P Criptografado</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação da DM e Busca */}
        <div className="flex items-center gap-2">
          {/* Busca na DM */}
          <div className="relative flex items-center">
            <div className={`relative flex items-center transition-all duration-200 ${searchQuery ? 'w-44 sm:w-56' : 'w-28 sm:w-36 focus-within:w-44 sm:focus-within:w-56'}`}>
              <input
                id="input-dm-search"
                type="text"
                placeholder="Buscar na DM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                className={`w-full bg-slate-900/80 border rounded-full px-2.5 py-1 pl-7 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  searchQuery
                    ? 'border-cyan-400/80 ring-2 ring-cyan-500/30 pr-14 bg-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'border-white/15 hover:border-white/25 focus:border-cyan-400/70'
                }`}
              />
              <Search className={`w-3.5 h-3.5 absolute left-2 transition-colors pointer-events-none ${searchQuery ? 'text-cyan-400' : 'text-slate-400'}`} />

              {searchQuery && (
                <div className="absolute right-1.5 flex items-center gap-1">
                  <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded-full border border-cyan-800/60 leading-none">
                    {filteredMessages.length}
                  </span>
                  <button
                    id="btn-clear-dm-search"
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

          <button
            id="btn-dm-voice-call"
            onClick={() => onStartVoiceCall(friendUser)}
            className="p-2 rounded-xl glass-dock text-slate-300 hover:text-emerald-400 hover:border-emerald-400/40 transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 shadow-md"
            title="Iniciar Chamada de Voz"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            id="btn-dm-video-call"
            onClick={() => onStartVideoCall(friendUser)}
            className="p-2 rounded-xl glass-dock text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 shadow-md"
            title="Iniciar Transmissão de Vídeo"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Histórico de Mensagens */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin"
      >
        {/* Banner inicial de contato */}
        {!searchQuery && (
          <div className="my-6 p-6 glass-dock rounded-3xl border border-white/10 flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-3">
              <img
                src={friendUser.avatarUrl}
                alt={friendUser.username}
                className="w-full h-full rounded-[1.4rem] object-cover"
              />
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">
              {friendUser.username}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Este é o início da sua linha de comunicação quântica privada com {friendUser.username}.
            </p>
          </div>
        )}

        {/* Empty State para Busca sem resultados na DM */}
        {searchQuery && filteredMessages.length === 0 && (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Search className="w-7 h-7 text-cyan-400/80" />
            </div>
            <h4 className="text-base font-bold text-white">Nenhuma mensagem encontrada</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Não encontramos nenhuma mensagem contendo <strong className="text-cyan-300">"{searchQuery}"</strong> nesta conversa.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-all cursor-pointer"
            >
              Limpar filtro de busca
            </button>
          </div>
        )}

        {/* Lista de Mensagens */}
        {filteredMessages.map((msg) => {
          const isMe = currentUser?.id === msg.author.id;
          return (
            <div
              key={msg.id}
              className="group flex gap-3.5 p-2 rounded-2xl hover:bg-white/[0.04] transition-all duration-200"
            >
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
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatTimestamp(msg.timestamp)}
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

                <p className="text-slate-200 text-[14px] mt-1 break-words leading-relaxed font-normal">
                  {highlightMatches(msg.content, searchQuery)}
                </p>

                {/* Imagens anexadas */}
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

                {/* Reações */}
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

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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

      {/* Caixa de Entrada Spatial */}
      <div className="p-4 bg-white/[0.01] shrink-0 border-t border-white/10">
        <form
          onSubmit={handleSubmit}
          className="glass-dock rounded-2xl p-1.5 flex items-center gap-2 border border-white/15 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all shadow-xl"
        >
          <button
            type="button"
            onClick={() => setAttachedFile({ name: 'quantum_data.png', size: '1.1 MB' })}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
            title="Anexar dados"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Transmitir mensagem para @${friendUser.username}...`}
            className="flex-1 bg-transparent text-slate-200 text-[14px] placeholder-slate-500 focus:outline-none px-2 py-1"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
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
    </main>
  );
};
