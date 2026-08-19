import React, { useState } from 'react';
import { X, Hash, Volume2, Sparkles } from 'lucide-react';
import { Channel } from '../../types';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'text' | 'voice' | 'focus';
  defaultCategory?: string;
  onCreateChannel: (channelData: Partial<Channel>) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'text',
  defaultCategory = 'CANAIS DE TEXTO',
  onCreateChannel,
}) => {
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'focus'>(defaultType);
  const [channelName, setChannelName] = useState('');
  const [channelTopic, setChannelTopic] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    // Normaliza nome do canal para padrão do discord (sem espaços, minúsculas)
    const formattedName =
      channelType === 'text'
        ? channelName.trim().toLowerCase().replace(/\s+/g, '-')
        : channelName.trim();

    onCreateChannel({
      name: formattedName,
      type: channelType,
      category: defaultCategory || (channelType === 'focus' ? 'CANAIS DE FOCO' : channelType === 'voice' ? 'CANAIS DE VOZ' : 'CANAIS DE TEXTO'),
      topic: channelTopic.trim() || undefined,
    });

    setChannelName('');
    setChannelTopic('');
    onClose();
  };

  return (
    <div 
      id="create-channel-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div 
        id="create-channel-card"
        className="bg-[#1e1f22] w-full max-w-md rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Criar Canal</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo de Canal */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Canal
            </label>
            <div className="space-y-2">
              {/* Opção Texto */}
              <div
                onClick={() => setChannelType('text')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  channelType === 'text'
                    ? 'bg-[#2b2d31] border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-[#2b2d31]/50 border-slate-800 hover:bg-[#2b2d31]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Texto</div>
                    <div className="text-[11px] text-slate-400">
                      Poste mensagens, imagens, links e discussões
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="channel-type"
                  checked={channelType === 'text'}
                  onChange={() => setChannelType('text')}
                  className="accent-cyan-500"
                />
              </div>

              {/* Opção Foco & Pomodoro */}
              <div
                onClick={() => setChannelType('focus')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  channelType === 'focus'
                    ? 'bg-[#2b2d31] border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-[#2b2d31]/50 border-slate-800 hover:bg-[#2b2d31]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>Foco & Pomodoro</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">NOVO</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Sessão sincronizada, ondas binaurais 40Hz, DND e tarefas
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="channel-type"
                  checked={channelType === 'focus'}
                  onChange={() => setChannelType('focus')}
                  className="accent-cyan-500"
                />
              </div>

              {/* Opção Voz */}
              <div
                onClick={() => setChannelType('voice')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  channelType === 'voice'
                    ? 'bg-[#2b2d31] border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-[#2b2d31]/50 border-slate-800 hover:bg-[#2b2d31]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Voz & Vídeo</div>
                    <div className="text-[11px] text-slate-400">
                      Converse por voz, webcam e compartilhamento de tela WebRTC
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="channel-type"
                  checked={channelType === 'voice'}
                  onChange={() => setChannelType('voice')}
                  className="accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Nome do Canal */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Nome do Canal
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold">
                {channelType === 'text' ? '#' : channelType === 'focus' ? '✨' : '🔊'}
              </span>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={channelType === 'text' ? 'novo-canal' : channelType === 'focus' ? 'Deep Work Sprint 25m' : 'Sala de Reunião'}
                required
                className="w-full bg-[#111214] text-white text-sm pl-8 pr-3.5 py-2.5 rounded-lg outline-none border border-slate-800 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Tópico do Canal */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Tópico do Canal (Opcional)
            </label>
            <input
              type="text"
              value={channelTopic}
              onChange={(e) => setChannelTopic(e.target.value)}
              placeholder="Descreva o propósito deste canal..."
              className="w-full bg-[#111214] text-white text-sm px-3.5 py-2 rounded-lg outline-none border border-slate-800 focus:border-cyan-500"
            />
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-white hover:underline cursor-pointer px-3 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!channelName.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              Criar Canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
