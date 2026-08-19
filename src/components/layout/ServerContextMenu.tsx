import React, { useEffect, useRef, useState } from 'react';
import {
  Settings,
  Palette,
  Trash2,
  CheckCheck,
  UserPlus,
  PlusCircle,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { ServerGuild } from '../../types';

interface ServerContextMenuProps {
  server: ServerGuild;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenSettings: (server: ServerGuild) => void;
  onDeleteServer: (serverId: string) => void;
  onMarkAsRead?: (serverId: string) => void;
  onOpenInviteModal?: (server: ServerGuild) => void;
  onOpenCreateChannel?: (server: ServerGuild) => void;
}

export const ServerContextMenu: React.FC<ServerContextMenuProps> = ({
  server,
  position,
  onClose,
  onOpenSettings,
  onDeleteServer,
  onMarkAsRead,
  onOpenInviteModal,
  onOpenCreateChannel,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fecha ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Garante que o menu não saia da viewport da janela
  const menuWidth = 240;
  const menuHeight = confirmDelete ? 320 : 280;
  const safeX = Math.max(10, Math.min(position.x, window.innerWidth - menuWidth - 10));
  const safeY = Math.max(10, Math.min(position.y, window.innerHeight - menuHeight - 10));

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(server.id);
      setCopiedId(true);
      setTimeout(() => {
        setCopiedId(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div
      ref={menuRef}
      id="server-context-menu"
      style={{ top: `${safeY}px`, left: `${safeX}px` }}
      className="fixed z-50 w-60 bg-[#111214]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1.5 flex flex-col gap-0.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
    >
      {/* Header do Servidor */}
      <div className="px-2.5 py-2 border-b border-white/10 mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {server.iconUrl ? (
            <img
              src={server.iconUrl}
              alt={server.name}
              className="w-5 h-5 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-lg bg-violet-600/40 text-violet-300 font-bold flex items-center justify-center text-[10px] shrink-0">
              {server.acronym}
            </div>
          )}
          <span className="font-bold text-white text-xs truncate">{server.name}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
          NÓ
        </span>
      </div>

      {/* 1. Edit Server / Personalizar Servidor */}
      <button
        id="context-menu-edit-server"
        onClick={() => {
          onOpenSettings(server);
          onClose();
        }}
        className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-cyan-500/20 flex items-center gap-2.5 transition-colors cursor-pointer group"
      >
        <Settings className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs">Editar Servidor (Edit Server)</span>
          <span className="text-[10px] text-slate-400 truncate">Configurações, temas e canais</span>
        </div>
      </button>

      {/* 2. Convidar Pessoas */}
      {onOpenInviteModal && (
        <button
          id="context-menu-invite-people"
          onClick={() => {
            onOpenInviteModal(server);
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-indigo-500/20 flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-indigo-400" />
          <span>Convidar Pessoas</span>
        </button>
      )}

      {/* 3. Criar Canal */}
      {onOpenCreateChannel && (
        <button
          id="context-menu-create-channel"
          onClick={() => {
            onOpenCreateChannel(server);
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-slate-300" />
          <span>Criar Canal</span>
        </button>
      )}

      {/* 4. Marcar como Lido */}
      {onMarkAsRead && (
        <button
          id="context-menu-mark-as-read"
          onClick={() => {
            onMarkAsRead(server.id);
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>Marcar como Lido</span>
        </button>
      )}

      {/* 5. Copiar ID do Servidor */}
      <button
        id="context-menu-copy-id"
        onClick={handleCopyId}
        className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] flex items-center justify-between transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {copiedId ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
          <span>{copiedId ? 'ID Copiado!' : 'Copiar ID do Servidor'}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">#{server.id.slice(-4)}</span>
      </button>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* 6. Delete Server / Excluir Servidor com Confirmação In-Menu (Sem window.confirm para iframe) */}
      {!confirmDelete ? (
        <button
          id="context-menu-delete-server"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(true);
          }}
          className="w-full text-left px-2.5 py-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 flex items-center gap-2.5 transition-colors cursor-pointer group"
        >
          <Trash2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-xs">Excluir Servidor (Delete Server)</span>
        </button>
      ) : (
        <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/30 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Confirmar exclusão?</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-tight">
            Esta ação apagará <strong>{server.name}</strong> e todos os seus canais.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirm-delete-server-context"
              onClick={() => {
                onDeleteServer(server.id);
                onClose();
              }}
              className="flex-1 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
