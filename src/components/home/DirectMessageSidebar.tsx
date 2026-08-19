import React from 'react';
import {
  Users,
  Sparkles,
  Plus,
  Mic,
  MicOff,
  Headphones,
  Settings,
  VolumeX,
  LogIn,
  Signal,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Keyboard,
} from 'lucide-react';
import { User, Friend, Channel } from '../../types';

interface DirectMessageSidebarProps {
  activeTab: 'friends' | 'nitro' | string;
  onSelectTab: (tab: 'friends' | 'nitro' | string) => void;
  friends: Friend[];
  currentUser: User | null;
  activeVoiceChannel?: Channel | null;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onDisconnectVoice?: () => void;
  onReturnToVoice?: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenSecurity: () => void;
  onStartNewDM?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const DirectMessageSidebar: React.FC<DirectMessageSidebarProps> = ({
  activeTab,
  onSelectTab,
  friends,
  currentUser,
  activeVoiceChannel,
  isMuted,
  isDeafened,
  isVideoOn = false,
  isScreenSharing = false,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onDisconnectVoice,
  onReturnToVoice,
  onOpenSettings,
  onOpenAuth,
  onOpenShortcutsModal,
}) => {
  const confirmedFriends = friends.filter((f) => f.relationship === 'friend');
  const pendingCount = friends.filter((f) => f.relationship === 'pending_incoming').length;

  return (
    <aside 
      id="dm-sidebar" 
      aria-label="Mensagens Diretas"
      className="w-60 md:w-64 glass-panel rounded-2xl flex flex-col shrink-0 select-none shadow-xl border border-white/10 relative overflow-hidden h-full min-h-0"
    >
      {/* Botão de Busca Rápida no topo */}
      <div className="h-12 border-b border-white/10 px-3.5 flex items-center shrink-0">
        <button
          onClick={() => onSelectTab('friends')}
          className="w-full bg-slate-900/60 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all border border-white/5 hover:border-cyan-400/40 cursor-pointer shadow-inner"
        >
          <span>Buscar conversa...</span>
          <kbd className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-cyan-400 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navegação da Home (Amigos, Nitro) e Lista de DMs */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3 scrollbar-thin min-h-0">
        {/* Itens Fixos: Amigos e Nitro */}
        <div className="space-y-0.5">
          <button
            id="btn-dm-friends"
            onClick={() => onSelectTab('friends')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white font-bold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Amigos & Conexões</span>
            </div>
            {pendingCount > 0 && (
              <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.6)]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            id="btn-dm-nitro"
            onClick={() => onSelectTab('nitro')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
              activeTab === 'nitro'
                ? 'bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 text-white font-bold border border-fuchsia-400/30 shadow-[0_0_12px_rgba(217,70,239,0.15)]'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>Quantum Nitro</span>
          </button>
        </div>

        {/* Seção Mensagens Diretas */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Mensagens Privadas</span>
            <button
              onClick={() => onSelectTab('friends')}
              title="Nova Conversa"
              className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer p-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {confirmedFriends.map((friend) => {
              const dmId = `dm-${friend.user.id}`;
              const isActive = activeTab === dmId;
              const { user } = friend;

              return (
                <button
                  key={user.id}
                  id={`btn-dm-${user.id}`}
                  onClick={() => onSelectTab(dmId)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500/25 to-purple-500/20 text-white font-bold border border-violet-400/40 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-white/10"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-950 ${
                        user.status === 'online'
                          ? 'bg-emerald-400 shadow-[0_0_4px_#10b981]'
                          : user.status === 'idle'
                          ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                          : user.status === 'dnd'
                          ? 'bg-rose-400 shadow-[0_0_4px_#f43f5e]'
                          : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1 text-left leading-tight">
                    <div className="text-xs font-bold truncate">
                      {user.username}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user.activity?.name || user.customStatus || user.status}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAINEL DE CONEXÃO DE VOZ ATIVA NA HOME */}
      {activeVoiceChannel && (
        <div 
          id="dm-active-voice-connection-panel"
          className="mx-2 mb-2 p-2 rounded-xl glass-dock border border-emerald-500/30 shrink-0 shadow-lg space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between">
            <div 
              onClick={onReturnToVoice}
              className="flex items-center gap-2 cursor-pointer group min-w-0 flex-1"
              title="Voltar para a sala de voz"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Signal className="w-3 h-3 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black text-emerald-400 leading-none uppercase tracking-wide">
                  Voz Conectada
                </div>
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate mt-0.5">
                  {activeVoiceChannel.name}
                </div>
              </div>
            </div>

            {onDisconnectVoice && (
              <button
                id="btn-dm-sidebar-disconnect-voice"
                onClick={onDisconnectVoice}
                className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/80 transition-all cursor-pointer"
                title="Desconectar"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* BOTÕES DE CONTROLE RÁPIDO DE TRANSMISSÃO */}
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <button
              id="btn-dm-sidebar-screenshare"
              onClick={onToggleScreenShare}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer border ${
                isScreenSharing
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300/40 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-white/5 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border-white/10 hover:border-cyan-400/30'
              }`}
              title={isScreenSharing ? 'Interromper Transmissão de Tela' : 'Transmitir Sua Tela'}
            >
              <MonitorUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isScreenSharing ? 'Ao Vivo' : 'Tela'}</span>
            </button>

            <button
              id="btn-dm-sidebar-video"
              onClick={onToggleVideo}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer border ${
                isVideoOn
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300/40 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
              }`}
              title={isVideoOn ? 'Desligar Câmera' : 'Ligar Câmera'}
            >
              {isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5 text-slate-400" />}
              <span>Vídeo</span>
            </button>
          </div>
        </div>
      )}

      {/* Painel do Usuário Conectado */}
      <div 
        id="user-panel-footer"
        className="mx-2 mb-2 p-1.5 rounded-xl glass-dock border border-white/10 flex items-center justify-between shadow-lg shrink-0"
      >
        {currentUser ? (
          <>
            <div 
              onClick={onOpenSettings}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.08] transition-all cursor-pointer min-w-0 group"
              title="Configurações de Identidade"
            >
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/20 group-hover:ring-cyan-400 transition-all"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-950 ${
                    currentUser.status === 'online'
                      ? 'bg-emerald-400 shadow-[0_0_4px_#10b981]'
                      : currentUser.status === 'idle'
                      ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                      : currentUser.status === 'dnd'
                      ? 'bg-rose-400 shadow-[0_0_4px_#f43f5e]'
                      : 'bg-slate-500'
                  }`}
                />
              </div>

              <div className="min-w-0 flex flex-col leading-none">
                <span className="text-[11px] font-bold text-white truncate max-w-[65px]">
                  {currentUser.username}
                </span>
                <span className="text-[9px] text-cyan-400/80 font-mono truncate mt-0.5">
                  #{currentUser.discriminator}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 text-slate-300">
              <button
                id="btn-footer-mute"
                onClick={onToggleMute}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isMuted
                    ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40'
                    : 'hover:bg-white/10 hover:text-white'
                }`}
                title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <button
                id="btn-footer-deafen"
                onClick={onToggleDeafen}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isDeafened
                    ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40'
                    : 'hover:bg-white/10 hover:text-white'
                }`}
                title={isDeafened ? 'Desativar Silêncio' : 'Silenciar Tudo'}
              >
                {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
              </button>

              <button
                id="btn-footer-shortcuts"
                onClick={onOpenShortcutsModal}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-cyan-300 transition-all cursor-pointer"
                title="Atalhos do Teclado (Ctrl + /)"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-footer-settings"
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-cyan-300 transition-all cursor-pointer"
                title="Configurações do Usuário (Ctrl + ,)"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-1.5 px-2.5 rounded-lg transition-all font-bold cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </aside>
  );
};
