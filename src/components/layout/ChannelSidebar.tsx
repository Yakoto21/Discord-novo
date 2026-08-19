import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Hash,
  Volume2,
  ChevronDown,
  Plus,
  Mic,
  MicOff,
  Headphones,
  Settings,
  ShieldCheck,
  Video,
  VideoOff,
  LogIn,
  Radio,
  Share2,
  UserPlus,
  Sliders,
  VolumeX,
  Sparkles,
  PhoneOff,
  Signal,
  Tv,
  MonitorUp,
  Keyboard,
} from 'lucide-react';
import { Channel, User, VoiceParticipant, ServerGuild } from '../../types';

interface ChannelSidebarProps {
  currentServer: ServerGuild | null;
  channels: Channel[];
  activeChannelId: string;
  activeVoiceChannelId: string | null;
  activeVoiceChannel?: Channel | null;
  currentUser: User | null;
  voiceRoomsStatus: Record<string, VoiceParticipant[]>;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  onSelectChannel: (channel: Channel) => void;
  onJoinVoiceChannel: (channel: Channel) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onDisconnectVoice?: () => void;
  onReturnToVoice?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSecurity: () => void;
  onOpenCreateChannel?: (type: 'text' | 'voice') => void;
  onOpenInviteModal?: () => void;
  onOpenServerSettings?: () => void;
  onOpenUserSettings?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  currentServer,
  channels,
  activeChannelId,
  activeVoiceChannelId,
  activeVoiceChannel,
  currentUser,
  voiceRoomsStatus,
  isMuted,
  isDeafened,
  isVideoOn = false,
  isScreenSharing = false,
  onSelectChannel,
  onJoinVoiceChannel,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onDisconnectVoice,
  onReturnToVoice,
  onOpenAuth,
  onOpenSecurity,
  onOpenCreateChannel,
  onOpenInviteModal,
  onOpenServerSettings,
  onOpenUserSettings,
  onOpenShortcutsModal,
}) => {
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Garante que canais filtrados sejam únicos por id
  const uniqueChannels = useMemo(() => {
    const seen = new Set<string>();
    return channels.filter((c) => {
      if (!c?.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [channels]);

  const textChannels = useMemo(() => uniqueChannels.filter((c) => c.type === 'text'), [uniqueChannels]);
  const focusChannels = useMemo(() => uniqueChannels.filter((c) => c.type === 'focus'), [uniqueChannels]);
  const voiceChannels = useMemo(() => uniqueChannels.filter((c) => c.type === 'voice'), [uniqueChannels]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsServerMenuOpen(false);
      }
    };
    if (isServerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isServerMenuOpen]);

  return (
    <aside 
      id="channel-sidebar" 
      aria-label="Canais do Servidor"
      className="w-60 md:w-64 glass-panel rounded-2xl flex flex-col shrink-0 select-none shadow-xl border border-white/10 relative overflow-hidden h-full min-h-0"
    >
      {/* Cabeçalho do Servidor com Dropdown Spatial */}
      <div className="relative shrink-0" ref={menuRef}>
        <div 
          id="server-header"
          onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
          className="h-12 border-b border-white/10 px-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            {currentServer?.iconUrl ? (
              <img
                src={currentServer.iconUrl}
                alt={currentServer.name}
                className="w-5 h-5 rounded-md object-cover border border-white/20 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
                <ShieldCheck className="w-3 h-3 text-white shrink-0" />
              </div>
            )}
            <span className="truncate text-xs font-black tracking-wide text-white">
              {currentServer?.name || 'Dev Community Brasil'}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${
              isServerMenuOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </div>

        {/* Dropdown Menu Glassmorphism */}
        {isServerMenuOpen && (
          <div className="absolute top-13 left-2 right-2 z-40 glass-dock p-2 rounded-xl shadow-2xl border border-white/15 space-y-1 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                if (onOpenInviteModal) onOpenInviteModal();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <span>Convidar Amigos</span>
              <UserPlus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                if (onOpenServerSettings) onOpenServerSettings();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
            >
              <span>Configurações do Servidor</span>
              <Sliders className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                if (onOpenCreateChannel) onOpenCreateChannel('text');
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
            >
              <span>Criar Canal</span>
              <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="h-[1px] bg-white/10 my-1" />

            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                if (onOpenSecurity) onOpenSecurity();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <span>Segurança & WebRTC Status</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lista de Canais */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3 scrollbar-thin min-h-0">
        {/* Canais de Texto */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              Canais de Texto
            </span>
            {onOpenCreateChannel && (
              <button
                onClick={() => onOpenCreateChannel('text')}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer p-0.5"
                title="Criar Canal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isActive = activeChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  id={`channel-btn-${channel.id}`}
                  onClick={() => onSelectChannel(channel)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white font-bold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  <Hash className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="truncate flex-1">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Canais de Foco & Pomodoro Sincronizado */}
        {focusChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4] animate-ping" />
                <span className="text-cyan-300">Canais de Foco</span>
              </span>
            </div>

            <div className="space-y-0.5">
              {focusChannels.map((channel) => {
                const isActive = activeChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    id={`focus-channel-btn-${channel.id}`}
                    onClick={() => onSelectChannel(channel)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group text-left cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-cyan-400 animate-spin' : 'text-cyan-500/70 group-hover:text-cyan-300'
                      }`}
                    />
                    <span className="truncate flex-1">{channel.name}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                      25m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Canais de Voz & Vídeo WebRTC */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              Canais de Voz
            </span>
            {onOpenCreateChannel && (
              <button
                onClick={() => onOpenCreateChannel('voice')}
                className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer p-0.5"
                title="Criar Canal de Voz"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {voiceChannels.map((channel) => {
              const isActive = activeVoiceChannelId === channel.id;
              const participants = voiceRoomsStatus[channel.id] || [];

              return (
                <div key={channel.id} className="space-y-0.5">
                  <button
                    key={channel.id}
                    id={`voice-channel-btn-${channel.id}`}
                    onClick={() => onJoinVoiceChannel(channel)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group text-left cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    <Volume2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate flex-1">{channel.name}</span>
                    {participants.length > 0 && (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                        {participants.length}
                      </span>
                    )}
                  </button>

                  {/* Participantes na Frequência */}
                  {participants.length > 0 && (
                    <div className="pl-5 pr-1 space-y-0.5 py-0.5">
                      {participants.map((p) => (
                        <div
                          key={p.socketId}
                          className="flex items-center justify-between px-2 py-0.5 rounded-lg bg-slate-900/60 border border-white/5 text-[11px] text-slate-300"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img
                              src={p.avatarUrl}
                              alt={p.username}
                              className={`w-3.5 h-3.5 rounded-full object-cover ${
                                p.isSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_6px_#10b981]' : ''
                              }`}
                            />
                            <span className="truncate">{p.username}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 text-slate-400">
                            {p.isVideoOn && <Video className="w-2.5 h-2.5 text-cyan-400" />}
                            {p.isScreenSharing && <Share2 className="w-2.5 h-2.5 text-emerald-400" />}
                            {p.isMuted ? (
                              <MicOff className="w-2.5 h-2.5 text-rose-400" />
                            ) : p.isSpeaking ? (
                              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAINEL DE CONEXÃO DE VOZ ATIVA ESTILO DISCORD COM BOTÃO DE TRANSMISSÃO DE TELA */}
      {activeVoiceChannel && (
        <div 
          id="active-voice-connection-panel"
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
                id="btn-sidebar-disconnect-voice"
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
            {/* Botão de Transmissão de Tela Nítido */}
            <button
              id="btn-sidebar-screenshare"
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

            {/* Botão de Câmera/Vídeo */}
            <button
              id="btn-sidebar-video"
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

      {/* Painel Inferior de Usuário em Cápsula */}
      <div 
        id="user-panel"
        className="mx-2 mb-2 p-1.5 rounded-xl glass-dock border border-white/10 flex items-center justify-between shadow-lg shrink-0"
      >
        {currentUser ? (
          <>
            <div 
              onClick={onOpenUserSettings}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.08] transition-all cursor-pointer min-w-0 group"
              title="Abrir Painel de Identidade"
            >
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/20 group-hover:ring-cyan-400 transition-all"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-900 ${
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

            {/* Controles de Áudio e Configuração */}
            <div className="flex items-center gap-0.5 text-slate-300">
              <button
                id="btn-toggle-mute"
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
                id="btn-toggle-deafen"
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
                id="btn-keyboard-shortcuts"
                onClick={onOpenShortcutsModal}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-cyan-300 transition-all cursor-pointer"
                title="Atalhos do Teclado (Ctrl + /)"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-user-settings-gear"
                onClick={onOpenUserSettings}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-cyan-300 transition-all cursor-pointer"
                title="Configurações do Usuário (Ctrl + ,)"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            id="btn-login-prompt"
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
