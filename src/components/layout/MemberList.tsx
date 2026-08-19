import React from 'react';
import { Crown, Shield, Code2, Gamepad2, Music, Code } from 'lucide-react';
import { User } from '../../types';

interface MemberListProps {
  members: User[];
  currentUserId?: string;
  onSelectMember?: (user: User) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUserId,
  onSelectMember,
}) => {
  const admins = members.filter((m) => m.role === 'admin');
  const moderators = members.filter((m) => m.role === 'moderator');
  const regularMembers = members.filter((m) => m.role === 'member');

  const renderGroup = (
    title: string,
    userList: User[],
    roleIcon?: React.ReactNode,
    roleColor?: string
  ) => {
    if (userList.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-1.5 px-3 mb-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">
          {roleIcon}
          <span>
            {title} — {userList.length}
          </span>
        </div>

        <div className="space-y-1">
          {userList.map((member) => {
            const isMe = member.id === currentUserId;
            return (
              <div
                key={member.id}
                id={`member-item-${member.id}`}
                onClick={() => onSelectMember && onSelectMember(member)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-white/[0.06] transition-all duration-200 cursor-pointer group ${
                  isMe ? 'bg-white/[0.04] border border-white/5' : ''
                }`}
              >
                {/* Avatar com status dot */}
                <div className="relative shrink-0">
                  <img
                    src={member.avatarUrl}
                    alt={member.username}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/15 group-hover:ring-cyan-400 transition-all"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                      member.status === 'online'
                        ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                        : member.status === 'idle'
                        ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : member.status === 'dnd'
                        ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                        : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[13px] font-bold truncate ${
                        roleColor ? roleColor : 'text-slate-200'
                      } group-hover:text-white`}
                    >
                      {member.username}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-full font-black">
                        VOCÊ
                      </span>
                    )}
                  </div>

                  {member.activity ? (
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      {member.activity.type === 'playing' && (
                        <Gamepad2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                      {member.activity.type === 'listening' && (
                        <Music className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                      {member.activity.type === 'coding' && (
                        <Code className="w-3 h-3 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">{member.activity.name}</span>
                    </div>
                  ) : member.customStatus ? (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {member.customStatus}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside 
      id="member-list" 
      aria-label="Tripulantes do Servidor"
      className="w-52 lg:w-56 glass-panel rounded-2xl flex flex-col shrink-0 select-none overflow-y-auto p-2.5 border border-white/10 shadow-xl hidden xl:flex scrollbar-thin h-full min-h-0"
    >
      <div className="px-2.5 py-1.5 mb-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-black tracking-wider uppercase text-slate-300">Tripulação</span>
        <span className="text-[10px] font-bold bg-white/10 text-cyan-300 px-1.5 py-0.2 rounded-full">{members.length}</span>
      </div>

      {renderGroup('👑 Administrador', admins, <Crown className="w-3.5 h-3.5 text-amber-400" />, 'text-amber-400')}
      {renderGroup('🚀 Moderador', moderators, <Shield className="w-3.5 h-3.5 text-emerald-400" />, 'text-emerald-400')}
      {renderGroup('💻 Desenvolvedores', regularMembers, <Code2 className="w-3.5 h-3.5 text-cyan-400" />)}
    </aside>
  );
};
