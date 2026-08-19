import React from 'react';
import { Shield, Sparkles, Gamepad2, Music, Code } from 'lucide-react';
import { User } from '../../types';

interface MemberListProps {
  members: User[];
  onSelectMember: (user: User) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  onSelectMember,
}) => {
  const onlineMembers = members.filter((m) => m.status !== 'offline');
  const offlineMembers = members.filter((m) => m.status === 'offline');

  const renderMember = (user: User) => {
    return (
      <button
        key={user.id}
        id={`member-item-${user.id}`}
        onClick={() => onSelectMember(user)}
        className="w-full flex items-center gap-3 px-2 py-1.5 rounded-[4px] hover:bg-[#35373c] transition-colors group cursor-pointer text-left"
      >
        <div className="relative shrink-0">
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-semibold truncate leading-tight ${
                user.role === 'admin'
                  ? 'text-[#f0b232]'
                  : user.role === 'moderator'
                  ? 'text-[#23a55a]'
                  : 'text-[#dbdee1] group-hover:text-white'
              }`}
            >
              {user.username}
            </span>
            {user.role === 'admin' && (
              <span title="Dono / Administrador" className="text-xs">
                👑
              </span>
            )}
            {user.role === 'moderator' && (
              <span title="Moderador" className="text-xs">
                🚀
              </span>
            )}
          </div>

          {/* Atividade ou Status */}
          <div className="text-[11px] text-[#949ba4] truncate flex items-center gap-1 mt-0.5">
            {user.activity ? (
              <>
                {user.activity.type === 'playing' && <Gamepad2 className="w-3 h-3 text-[#23a55a]" />}
                {user.activity.type === 'listening' && <Music className="w-3 h-3 text-[#1db954]" />}
                {user.activity.type === 'coding' && <Code className="w-3 h-3 text-[#5865f2]" />}
                <span className="truncate">{user.activity.name}</span>
              </>
            ) : (
              <span className="truncate">{user.customStatus || user.status}</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <aside 
      id="member-list" 
      aria-label="Membros do Canal"
      className="w-60 bg-[#2b2d31] flex flex-col shrink-0 select-none border-l border-[#1f2023]/40 overflow-y-auto px-2 py-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1a1b1e]"
    >
      {/* Membros Online */}
      <div>
        <div className="px-2 mb-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
          Disponível — {onlineMembers.length}
        </div>
        <div className="space-y-0.5">{onlineMembers.map(renderMember)}</div>
      </div>

      {/* Membros Offline */}
      {offlineMembers.length > 0 && (
        <div>
          <div className="px-2 mb-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
            Offline — {offlineMembers.length}
          </div>
          <div className="space-y-0.5 opacity-60 hover:opacity-100 transition-opacity">
            {offlineMembers.map(renderMember)}
          </div>
        </div>
      )}
    </aside>
  );
};
