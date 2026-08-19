import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Smile,
  Paperclip,
  Sparkles,
  Pin,
  Check,
  CornerDownRight,
  Shield,
} from 'lucide-react';
import { Message, User } from '../../types';
import { highlightMatches } from './ChatArea';

interface ThreadSidePanelProps {
  parentMessage: Message;
  channelName: string;
  currentUser: User | null;
  onClose: () => void;
  onSendReply: (parentMessageId: string, content: string, attachments?: any[]) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onOpenAuth: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🔥', '😂', '🎉', '👀', '💯'];

export const ThreadSidePanel: React.FC<ThreadSidePanelProps> = ({
  parentMessage,
  channelName,
  currentUser,
  onClose,
  onSendReply,
  onAddReaction,
  onOpenAuth,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  const repliesContainerRef = useRef<HTMLDivElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const replies = parentMessage.threadReplies || [];

  useEffect(() => {
    if (repliesContainerRef.current) {
      repliesContainerRef.current.scrollTo({
        top: repliesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [replies.length]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [parentMessage.id]);

  // Listener para ESC fechar o painel lateral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const trimmed = replyText.trim();
    if (!trimmed && !attachedFile) return;

    const attachments = attachedFile
      ? [
          {
            id: `att-${Date.now()}`,
            name: attachedFile.name,
            size: 1024 * 60,
            type: attachedFile.type.startsWith('image') ? 'image' : 'file',
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          },
        ]
      : [];

    onSendReply(parentMessage.id, trimmed, attachments);
    setReplyText('');
    setAttachedFile(null);
    setShowEmojiPicker(false);
  };

  return (
    <aside
      id="thread-side-panel"
      className="w-80 sm:w-96 lg:w-[420px] shrink-0 h-full flex flex-col glass-dock border-l border-white/10 bg-slate-950/95 shadow-2xl z-20 relative overflow-hidden animate-in slide-in-from-right-4 duration-300"
    >
      {/* 1. Header do Painel Lateral de Thread */}
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>Tópico</span>
              <span className="text-xs text-cyan-400/80 font-mono">#{channelName}</span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Iniciado por <strong className="text-slate-200">@{parentMessage.author.username}</strong>
            </p>
          </div>
        </div>

        <button
          id="btn-close-thread-panel"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar painel de thread (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Conteúdo Rolável: Mensagem Raiz + Lista de Respostas */}
      <div
        ref={repliesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4"
      >
        {/* Card da Mensagem Raiz / Origem */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 relative shadow-sm">
          <div className="flex items-start gap-3">
            <img
              src={parentMessage.author.avatarUrl}
              alt={parentMessage.author.username}
              className="w-9 h-9 rounded-2xl object-cover ring-1 ring-cyan-500/30 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-cyan-200 truncate">
                  {parentMessage.author.username}
                </span>
                {parentMessage.author.role === 'admin' && (
                  <span className="text-[8px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                    Admin
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(parentMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1.5 break-words leading-relaxed whitespace-pre-wrap">
                {parentMessage.content}
              </p>

              {/* Anexos da Mensagem Raiz */}
              {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {parentMessage.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="rounded-xl overflow-hidden border border-white/10 max-w-xs shadow-md"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-auto object-cover max-h-40 rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divisor Visual com Contador de Respostas */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px bg-white/10 flex-1" />
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 font-mono px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20">
            <CornerDownRight className="w-3 h-3" />
            <span>{replies.length} {replies.length === 1 ? 'resposta' : 'respostas'}</span>
          </div>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* Lista de Respostas da Thread */}
        {replies.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
            <MessageSquare className="w-8 h-8 mx-auto text-cyan-400/40 mb-2" />
            <p className="text-xs font-semibold text-slate-300">Nenhuma resposta ainda</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Envie a primeira mensagem para continuar o contexto deste tópico.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => {
              const isMe = reply.author.id === currentUser?.id;
              return (
                <div
                  key={reply.id}
                  className={`p-3 rounded-2xl border transition-all text-xs ${
                    isMe
                      ? 'bg-cyan-950/15 border-cyan-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={reply.author.avatarUrl}
                      alt={reply.author.username}
                      className="w-7 h-7 rounded-xl object-cover ring-1 ring-white/10 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${isMe ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {reply.author.username}
                        </span>
                        {reply.author.role === 'admin' && (
                          <span className="text-[8px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                            Admin
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-200 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                        {reply.content}
                      </p>

                      {/* Anexos da Resposta */}
                      {reply.attachments && reply.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reply.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-white/10 max-w-xs shadow-md"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-auto object-cover max-h-36 rounded-xl"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reações na Resposta */}
                      {reply.reactions && reply.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {reply.reactions.map((react, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 border border-white/10 flex items-center gap-1 text-slate-300"
                            >
                              <span>{react.emoji}</span>
                              <span className="text-cyan-300 font-bold">{react.count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div ref={repliesEndRef} />
      </div>

      {/* 3. Input de Resposta na Thread */}
      <div className="p-3 border-t border-white/10 bg-slate-950/80 shrink-0">
        {currentUser ? (
          <form onSubmit={handleSend} className="space-y-2">
            {/* Preview de Anexo Local */}
            {attachedFile && (
              <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-cyan-300 font-mono truncate max-w-[200px]">
                  📎 {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-rose-400 hover:text-rose-300 ml-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Picker Rápido de Emojis */}
            {showEmojiPicker && (
              <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-wrap gap-1 shadow-lg">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setReplyText((prev) => prev + em);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded-lg text-sm transition-all cursor-pointer hover:scale-120"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-1.5 p-2 rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-cyan-500/50 transition-all">
              {/* Botão de Anexo Simulado */}
              <button
                type="button"
                onClick={() => {
                  setAttachedFile({
                    name: `screenshot-${Date.now().toString().slice(-4)}.png`,
                    size: '45 KB',
                    type: 'image/png',
                  });
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                title="Anexar arquivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                id="input-thread-reply"
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={`Responder a @${parentMessage.author.username}...`}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none max-h-24 py-1 leading-relaxed"
              />

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                title="Inserir emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                id="btn-send-thread-reply"
                type="submit"
                disabled={!replyText.trim() && !attachedFile}
                className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                  replyText.trim() || attachedFile
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:scale-105'
                    : 'text-slate-600 bg-white/5 cursor-not-allowed'
                }`}
                title="Enviar resposta (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <button
            id="btn-thread-login-prompt"
            onClick={onOpenAuth}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Entre para responder neste tópico</span>
          </button>
        )}
      </div>
    </aside>
  );
};
