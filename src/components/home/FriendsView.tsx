import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  Search,
  UserPlus,
  Check,
  X,
  Sparkles,
  Gamepad2,
  Music,
  Code,
  Flame,
} from 'lucide-react';
import { Friend, User } from '../../types';

interface FriendsViewProps {
  friends: Friend[];
  onStartDM: (user: User) => void;
  onStartCall: (user: User) => void;
  onAddFriend: (usernameOrTag: string) => boolean;
  onAcceptFriendRequest: (friendId: string) => void;
  onRejectFriendRequest: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onSelectUserForProfile?: (user: User) => void;
}

type FriendsTab = 'online' | 'all' | 'pending' | 'blocked' | 'add';

export const FriendsView: React.FC<FriendsViewProps> = ({
  friends,
  onStartDM,
  onStartCall,
  onAddFriend,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  onSelectUserForProfile,
}) => {
  const [activeTab, setActiveTab] = useState<FriendsTab>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;

    const success = onAddFriend(addFriendInput.trim());
    if (success) {
      setAddFriendFeedback({
        type: 'success',
        message: `Frequência de amizade enviada com sucesso para ${addFriendInput}!`,
      });
      setAddFriendInput('');
    } else {
      setAddFriendFeedback({
        type: 'error',
        message: 'Não foi possível encontrar esse tripulante. Verifique a grafia e tag.',
      });
    }

    setTimeout(() => {
      setAddFriendFeedback(null);
    }, 4000);
  };

  const pendingRequests = friends.filter((f) => f.relationship === 'pending_incoming' || f.relationship === 'pending_outgoing');
  const confirmedFriends = friends.filter((f) => f.relationship === 'friend');
  const onlineFriends = confirmedFriends.filter((f) => f.user.status !== 'offline');
  const blockedFriends = friends.filter((f) => f.relationship === 'blocked');

  const getFilteredList = () => {
    let list: Friend[] = [];
    if (activeTab === 'online') list = onlineFriends;
    else if (activeTab === 'all') list = confirmedFriends;
    else if (activeTab === 'pending') list = pendingRequests;
    else if (activeTab === 'blocked') list = blockedFriends;

    if (searchQuery.trim()) {
      return list.filter((f) =>
        f.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  };

  const displayList = getFilteredList();

  return (
    <main 
      id="friends-view" 
      aria-label="Amigos e Conexões"
      className="flex-1 glass-panel rounded-2xl flex flex-col min-w-0 min-h-0 h-full relative overflow-hidden select-none border border-white/10 shadow-xl"
    >
      {/* Topo / Barra de Abas em Pílulas */}
      <div 
        id="friends-header"
        className="h-16 border-b border-white/10 px-5 flex items-center justify-between shrink-0 bg-white/[0.02] backdrop-blur-xl z-10"
      >
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1">
          <div className="flex items-center gap-2 text-white font-extrabold pr-3 border-r border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.35)]">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="tracking-wide text-sm hidden sm:inline">Conexões</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="tab-friends-online"
              onClick={() => setActiveTab('online')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'online'
                  ? 'bg-white/15 text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Online ({onlineFriends.length})
            </button>

            <button
              id="tab-friends-all"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white/15 text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Todos ({confirmedFriends.length})
            </button>

            <button
              id="tab-friends-pending"
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white/15 text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span>Pendentes</span>
              {pendingRequests.length > 0 && (
                <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              id="tab-friends-add"
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar Amigo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal da Aba */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Lado Esquerdo: Lista de Amigos ou Formulário de Adição */}
        <div className="flex-1 flex flex-col overflow-hidden p-5">
          {activeTab === 'add' ? (
            <div className="max-w-xl space-y-5">
              <div>
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  Conectar Novo Tripulante
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Você pode adicionar amigos usando a sua tag universal (ex: DevNinja#1337).
                </p>
              </div>

              <form onSubmit={handleAddFriendSubmit} className="space-y-3">
                <div className="glass-dock rounded-2xl p-2 flex items-center border border-white/15 focus-within:border-emerald-400/60 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all">
                  <input
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    placeholder="Digite o Nome de Usuário#0000..."
                    className="flex-1 bg-transparent text-slate-200 text-sm px-3 focus:outline-none placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!addFriendInput.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      addFriendInput.trim()
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Enviar Pedido
                  </button>
                </div>

                {addFriendFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                      addFriendFeedback.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {addFriendFeedback.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>{addFriendFeedback.message}</span>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <>
              {/* Barra de Busca de Amigos */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar conexões..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full glass-dock border border-white/10 rounded-2xl px-4 py-2.5 pl-10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all placeholder-slate-500 shadow-inner"
                  />
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                </div>
              </div>

              {/* Lista de Conexões */}
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                {displayList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-slate-400 text-sm font-semibold">
                      Nenhuma conexão encontrada nesta frequência.
                    </span>
                  </div>
                ) : (
                  displayList.map((friend) => {
                    const { user } = friend;
                    return (
                      <div
                        key={user.id}
                        className="p-3 rounded-2xl glass-dock border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group shadow-lg"
                      >
                        <div
                          onClick={() => onSelectUserForProfile && onSelectUserForProfile(user)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/15"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                user.status === 'online'
                                  ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                                  : user.status === 'idle'
                                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                                  : user.status === 'dnd'
                                  ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                                  : 'bg-slate-500'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                                {user.username}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                #{user.discriminator}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {user.activity?.name || user.customStatus || user.status}
                            </div>
                          </div>
                        </div>

                        {/* Ações Rápidas de Comunicação */}
                        <div className="flex items-center gap-2">
                          {friend.relationship === 'pending_incoming' ? (
                            <>
                              <button
                                onClick={() => onAcceptFriendRequest(user.id)}
                                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40 transition-all cursor-pointer shadow-md"
                                title="Aceitar Transmissão"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onRejectFriendRequest(user.id)}
                                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 transition-all cursor-pointer shadow-md"
                                title="Recusar Transmissão"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onStartDM(user)}
                                className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 shadow-md"
                                title="Abrir Mensagem Direta"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onStartCall(user)}
                                className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-emerald-400 hover:border-emerald-400/40 transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 shadow-md"
                                title="Iniciar Frequência de Voz"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Lado Direito: Feed Ativo / Atividade da Rede */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
              Atividade Quântica Ativa
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl glass-dock border border-white/10">
              <div className="flex items-center gap-2.5 text-xs text-white font-bold mb-1">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>WebRTC Mesh Transceiver</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transmissões de tela em 60 FPS e canais de áudio de baixa latência ativos no nó principal.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-dock border border-white/10">
              <div className="flex items-center gap-2.5 text-xs text-white font-bold mb-1">
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span>Estúdio de Jogos & Streaming</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Conecte-se às salas de conferência para compartilhar partidas com bitrate dinâmico.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
