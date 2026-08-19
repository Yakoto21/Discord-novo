import React, { useState } from 'react';
import { X, Copy, Check, Link2, Share2, Users } from 'lucide-react';
import { ServerGuild, Friend } from '../../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: ServerGuild | null;
  friends: Friend[];
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  server,
  friends,
}) => {
  const [copied, setCopied] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  if (!isOpen || !server) return null;

  const inviteLink = `https://discord.gg/${server.id}-${server.acronym.toLowerCase()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInviteFriend = (friendId: string) => {
    setInvitedFriends((prev) => [...prev, friendId]);
  };

  return (
    <div 
      id="invite-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div 
        id="invite-modal-card"
        className="bg-[#313338] w-full max-w-md rounded-2xl shadow-2xl border border-[#3f4147] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#232428]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Convidar amigos para {server.name}</span>
            </h2>
            <p className="text-xs text-[#949ba4] mt-0.5">
              Envie um link de convite ou convide seus amigos diretamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-full hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Amigos para Convite Direto */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
              Convidar Amigos
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-[#1a1b1e] pr-1">
              {friends.map((friend) => {
                const isInvited = invitedFriends.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={friend.user.avatarUrl}
                        alt={friend.user.username}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0 truncate">
                        <div className="text-sm font-semibold text-white truncate">
                          {friend.user.username}
                        </div>
                        <div className="text-[11px] text-[#949ba4]">#{friend.user.discriminator}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInviteFriend(friend.id)}
                      disabled={isInvited}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        isInvited
                          ? 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/30'
                          : 'border border-[#23a55a] text-[#23a55a] hover:bg-[#23a55a] hover:text-white'
                      }`}
                    >
                      {isInvited ? 'Enviado' : 'Convidar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Link Copiável */}
          <div className="space-y-2 pt-2 border-t border-[#232428]">
            <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
              Ou envie o link de convite do servidor
            </label>
            <div className="flex items-center bg-[#1e1f22] rounded-lg p-1 border border-[#232428] focus-within:border-[#5865f2]">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full bg-transparent text-white text-xs px-2.5 py-1.5 outline-none font-mono"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  copied
                    ? 'bg-[#23a55a] text-white'
                    : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <div className="text-[11px] text-[#949ba4]">
              Seu link de convite nunca expira.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
