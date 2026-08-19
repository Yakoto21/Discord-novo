import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Phone,
  Video,
  Shield,
  Sparkles,
  Gamepad2,
  Music,
  Code,
  Check,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { User } from '../../types';

interface UserProfilePopoverProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onStartDM: (user: User) => void;
  onStartCall?: (user: User) => void;
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  user,
  isOpen,
  onClose,
  onStartDM,
  onStartCall,
}) => {
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveNote = () => {
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  return (
    <div 
      id="user-profile-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        id="user-profile-card"
        className="bg-[#18191c] w-full max-w-sm rounded-3xl shadow-2xl border border-[#2e3136] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner do Perfil (Cor ou Imagem Customizada) */}
        <div
          className="h-28 relative bg-cover bg-center"
          style={{ 
            backgroundColor: user.bannerColor || '#06b6d4',
            backgroundImage: user.bannerUrl ? `url("${user.bannerUrl}")` : undefined
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white p-1.5 rounded-full bg-black/50 hover:bg-black/80 transition-all cursor-pointer backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar e Badges */}
        <div className="px-5 pt-0 pb-5 relative bg-[#18191c]">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user.username}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[#18191c] shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#18191c] ${
                  user.status === 'online'
                    ? 'bg-[#23a55a]'
                    : user.status === 'idle'
                    ? 'bg-[#f0b232]'
                    : user.status === 'dnd'
                    ? 'bg-[#f23f43]'
                    : 'bg-[#80848e]'
                }`}
              />
            </div>

            {/* Badges */}
            <div className="bg-[#111214] px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-slate-800 shadow-sm">
              <span title="Bcrypt & Security Shield" className="text-xs text-cyan-400">
                🛡️
              </span>
              <span title="Nitro Booster" className="text-xs text-fuchsia-400">
                💎
              </span>
              <span title="Early Supporter" className="text-xs text-amber-400">
                👑
              </span>
            </div>
          </div>

          {/* Nome, Tag e Pronomes */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-white leading-tight">
                {user.username}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                #{user.discriminator || '0000'}
              </span>
            </div>
            {user.customStatus && (
              <div className="text-xs text-cyan-300 font-medium mt-1 flex items-center gap-1">
                <span>{user.customStatus}</span>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="h-px bg-slate-800/80 my-3" />

          {/* Sobre Mim */}
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
              Sobre Mim
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {user.bio || 'Membro da comunidade focado em engenharia de software e WebRTC.'}
            </p>
          </div>

          {/* Membro Desde */}
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
              Membro Desde
            </div>
            <p className="text-xs text-slate-400">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Fevereiro de 2026'}
            </p>
          </div>

          {/* Nota Pessoal */}
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Nota Pessoal (Só você vê)</span>
              {savedNote && <span className="text-emerald-400 lowercase flex items-center gap-0.5"><Check className="w-3 h-3" /> salva</span>}
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleSaveNote}
              placeholder="Clique para adicionar uma nota..."
              className="w-full bg-[#111214] text-xs text-white px-2.5 py-1.5 rounded-xl border border-slate-800 outline-none focus:border-cyan-500"
            />
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => {
                onStartDM(user);
                onClose();
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enviar DM</span>
            </button>

            {onStartCall && (
              <button
                onClick={() => {
                  onStartCall(user);
                  onClose();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ligar Agora</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
