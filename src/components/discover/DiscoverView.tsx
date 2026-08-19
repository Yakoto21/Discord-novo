import React, { useState } from 'react';
import {
  Compass,
  Search,
  Users,
  Check,
  Sparkles,
  Gamepad2,
  Music,
  Code,
  Shield,
  Bot,
  Zap,
} from 'lucide-react';
import { ServerGuild } from '../../types';
import { DISCOVERABLE_SERVERS } from '../../data/initialData';

interface DiscoverViewProps {
  onJoinServer: (server: ServerGuild) => void;
  joinedServerIds: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'Todas as Comunidades', icon: Compass },
  { id: 'games', label: 'Jogos & Gaming', icon: Gamepad2 },
  { id: 'tech', label: 'Tecnologia & Dev', icon: Code },
  { id: 'music', label: 'Música & Lo-Fi', icon: Music },
  { id: 'ai', label: 'Inteligência Artificial', icon: Bot },
  { id: 'security', label: 'Segurança & Cripto', icon: Shield },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onJoinServer,
  joinedServerIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServers = DISCOVERABLE_SERVERS.filter((server) => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (server.description && server.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'tech') return server.category === 'Tecnologia';
    if (selectedCategory === 'games') return server.category === 'Jogos';
    if (selectedCategory === 'music') return server.category === 'Música';
    if (selectedCategory === 'ai') return server.category === 'Inteligência Artificial';
    if (selectedCategory === 'security') return server.category === 'Segurança';
    return true;
  });

  return (
    <div 
      id="discover-view-root" 
      className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/10 text-[#dbdee1] overflow-y-auto scrollbar-thin select-none h-full min-h-0"
    >
      {/* Banner de Busca Superior */}
      <div className="relative bg-gradient-to-r from-[#5865f2] to-[#4752c4] p-8 md:p-12 text-white flex flex-col items-center justify-center text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
          Encontre sua comunidade no Discord
        </h1>
        <p className="text-sm md:text-base text-white/90 max-w-xl mb-6">
          De desenvolvimento web e WebRTC a servidores de jogos, música e IA. Há um lugar para todos.
        </p>

        {/* Input de Busca de Servidores */}
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            id="input-discover-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Explorar tópicos, linguagens, games e comunidades..."
            className="w-full bg-[#1e1f22] text-white text-sm px-4 py-3 pl-11 rounded-lg outline-none shadow-xl border border-[#232428] focus:border-white transition-all placeholder-[#80848e]"
          />
          <Search className="w-5 h-5 text-[#80848e] absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Categorias e Grade de Servidores */}
      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Chips de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#5865f2] text-white shadow-md'
                    : 'bg-[#2b2d31] text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Título de Seção */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">
            Comunidades em Destaque ({filteredServers.length})
          </h2>
        </div>

        {/* Grid de Servidores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServers.map((server) => {
            const isAlreadyJoined = joinedServerIds.includes(server.id);

            return (
              <div
                key={server.id}
                className="bg-[#2b2d31] rounded-xl overflow-hidden border border-[#35373c] hover:border-[#5865f2]/60 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                {/* Banner do Servidor */}
                <div className="h-28 bg-[#1e1f22] relative overflow-hidden">
                  {server.bannerUrl ? (
                    <img
                      src={server.bannerUrl}
                      alt={server.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#23a55a]" />
                  )}

                  {/* Avatar Sobreposto */}
                  <div className="absolute -bottom-4 left-4">
                    <img
                      src={server.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'}
                      alt={server.name}
                      className="w-12 h-12 rounded-xl object-cover border-4 border-[#2b2d31] shadow-md"
                    />
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 pt-6 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-1.5 group-hover:text-[#5865f2] transition-colors">
                      <span>{server.name}</span>
                    </h3>
                    <p className="text-xs text-[#949ba4] mt-1 line-clamp-2 leading-relaxed">
                      {server.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#35373c]/50 flex items-center justify-between text-xs text-[#949ba4]">
                    <div className="flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                      <span>{server.memberCount?.toLocaleString('pt-BR')} Membros</span>
                    </div>

                    <button
                      onClick={() => onJoinServer(server)}
                      className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isAlreadyJoined
                          ? 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40 hover:bg-[#23a55a] hover:text-white'
                          : 'bg-[#5865f2] hover:bg-[#4752c4] text-white shadow'
                      }`}
                    >
                      {isAlreadyJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Entrar / Aberto</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Entrar no Servidor</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
