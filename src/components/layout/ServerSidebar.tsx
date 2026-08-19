import React, { useState } from 'react';
import { MessageSquare, Compass, Plus, Shield, Terminal, Zap } from 'lucide-react';
import { ServerGuild } from '../../types';
import { ServerContextMenu } from './ServerContextMenu';

interface ServerSidebarProps {
  servers: ServerGuild[];
  activeServerId: string;
  onSelectServer: (serverId: string) => void;
  onOpenCreateServer: () => void;
  onOpenDiscover: () => void;
  onOpenSecurity: () => void;
  onOpenServerSettings?: (server: ServerGuild) => void;
  onDeleteServer?: (serverId: string) => void;
  onMarkAsRead?: (serverId: string) => void;
  onOpenInviteModal?: (server: ServerGuild) => void;
  onOpenCreateChannel?: (server: ServerGuild) => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onOpenCreateServer,
  onOpenDiscover,
  onOpenSecurity,
  onOpenServerSettings,
  onDeleteServer,
  onMarkAsRead,
  onOpenInviteModal,
  onOpenCreateChannel,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    server: ServerGuild;
    position: { x: number; y: number };
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, server: ServerGuild) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      server,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  return (
    <nav 
      id="server-sidebar" 
      aria-label="Servidores"
      className="w-[72px] glass-dock rounded-[2.2rem] flex flex-col items-center py-4 select-none shrink-0 z-30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
    >
      {/* Botão Quantum Home (DMs & Amigos) */}
      <div className="relative group mb-3 flex items-center justify-center w-full overflow-visible">
        {/* Glow pill indicator */}
        <div
          className={`absolute left-0 w-1.5 rounded-r-full transition-all duration-300 z-20 ${
            activeServerId === 'home'
              ? 'h-10 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_15px_#22d3ee]'
              : 'h-0 group-hover:h-5 bg-white/50'
          }`}
        />
        <div className="relative inline-flex items-center justify-center overflow-visible z-10">
          <button
            id="btn-server-home"
            onClick={() => onSelectServer('home')}
            className={`w-12 h-12 rounded-[1.4rem] transition-all duration-300 flex items-center justify-center cursor-pointer relative overflow-hidden group-hover:scale-105 active:scale-95 z-0 ${
              activeServerId === 'home'
                ? 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-300/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            }`}
            title="Mensagens Diretas & Hub Social"
          >
            <MessageSquare className="w-5 h-5 drop-shadow" />
          </button>
        </div>
      </div>

      {/* Divisor Cósmico */}
      <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent my-1.5" />

      {/* Lista de Servidores Espaciais */}
      <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto w-full py-1 scrollbar-none">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full overflow-visible">
              {/* Barra indicadora lateral */}
              <div
                className={`absolute left-0 w-1.5 rounded-r-full transition-all duration-300 z-20 ${
                  isActive
                    ? 'h-10 bg-gradient-to-b from-violet-400 to-fuchsia-500 shadow-[0_0_15px_#a855f7]'
                    : 'h-0 group-hover:h-5 bg-white/50'
                }`}
              />

              {/* Indicador de mensagem não lida (sem menção) */}
              {server.unread && !isActive && (!server.mentionCount || server.mentionCount === 0) && (
                <div className="absolute left-0 w-1.5 h-2 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20 pointer-events-none" />
              )}

              {/* Wrapper do botão com badge externo e overflow-visible */}
              <div className="relative inline-flex items-center justify-center overflow-visible z-10">
                <button
                  id={`btn-server-${server.id}`}
                  onClick={() => onSelectServer(server.id)}
                  onContextMenu={(e) => handleContextMenu(e, server)}
                  className={`w-12 h-12 rounded-[1.4rem] transition-all duration-300 flex items-center justify-center font-bold text-sm cursor-pointer relative overflow-hidden group-hover:scale-105 active:scale-95 z-0 ${
                    isActive
                      ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-violet-300/40'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-white/5 hover:border-violet-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  }`}
                  title={`${server.name} (Clique direito para opções)`}
                >
                  {server.iconUrl ? (
                    <img
                      src={server.iconUrl}
                      alt={server.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : server.id === 'guild-main' ? (
                    <Zap className="w-5 h-5 text-amber-400" />
                  ) : server.id === 'guild-webrtc' ? (
                    <Terminal className="w-5 h-5 text-cyan-400" />
                  ) : (
                    server.acronym
                  )}
                </button>

                {/* Badge de Notificações / Menções posicionado no topo da camada sem corte de overflow */}
                {Boolean(server.mentionCount && server.mentionCount > 0) && (
                  <div className="absolute -bottom-1 -right-1 z-30 pointer-events-none overflow-visible flex items-center justify-center">
                    <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center border-2 border-[#0e1220] shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse">
                      {server.mentionCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Adicionar Servidor (+) */}
        <div className="group flex items-center justify-center w-full mt-1">
          <button
            id="btn-add-server"
            onClick={onOpenCreateServer}
            className="w-12 h-12 rounded-[1.4rem] bg-slate-800/40 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            title="Criar Novo Nó / Servidor"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Explorar Servidores Públicos (Compass) */}
        <div className="group flex items-center justify-center w-full">
          <div
            className={`absolute left-0 w-1.5 rounded-r-full transition-all duration-300 ${
              activeServerId === 'discover'
                ? 'h-10 bg-gradient-to-b from-emerald-400 to-teal-500 shadow-[0_0_15px_#10b981]'
                : 'h-0 group-hover:h-5 bg-white/50'
            }`}
          />
          <button
            id="btn-explore-servers"
            onClick={onOpenDiscover}
            className={`w-12 h-12 rounded-[1.4rem] transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
              activeServerId === 'discover'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-emerald-300/40'
                : 'bg-slate-800/40 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-400/50'
            }`}
            title="Explorar Comunidades e Nós Globais"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Divisor Cósmico Inferior */}
      <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent my-1.5" />

      {/* Botão de Diagnóstico de Segurança Holográfico */}
      <div className="group flex items-center justify-center w-full">
        <button
          id="btn-open-security-status"
          onClick={onOpenSecurity}
          className="w-12 h-12 rounded-[1.4rem] bg-slate-800/40 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-400/50 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          title="Telemetria de Segurança, Bcrypt, JWT e STUN"
        >
          <Shield className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
        </button>
      </div>

      {/* Menu de Contexto do Botão Direito */}
      {contextMenu && (
        <ServerContextMenu
          server={contextMenu.server}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onOpenSettings={(srv) => {
            if (onOpenServerSettings) onOpenServerSettings(srv);
          }}
          onDeleteServer={(srvId) => {
            if (onDeleteServer) onDeleteServer(srvId);
          }}
          onMarkAsRead={(srvId) => {
            if (onMarkAsRead) onMarkAsRead(srvId);
          }}
          onOpenInviteModal={(srv) => {
            if (onOpenInviteModal) onOpenInviteModal(srv);
          }}
          onOpenCreateChannel={(srv) => {
            if (onOpenCreateChannel) onOpenCreateChannel(srv);
          }}
        />
      )}
    </nav>
  );
};
