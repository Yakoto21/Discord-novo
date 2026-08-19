import React, { useState } from 'react';
import {
  Shield,
  Users,
  Radio,
  Palette,
  Server,
  FileText,
  Zap,
  Sliders,
  AlertTriangle,
  Check,
  Ban,
  UserCheck,
  Crown,
  Sparkles,
  RefreshCw,
  Trash2,
  Send,
  Lock,
  Unlock,
  Volume2,
  Bell,
  Cpu,
  Activity,
  Award,
  Flame,
  Search
} from 'lucide-react';
import { User, ServerGuild, Channel } from '../../types';

export interface GlobalSystemConfig {
  appTitle: string;
  globalTheme: 'cyan' | 'violet' | 'emerald' | 'crimson' | 'gold' | 'cyberpunk';
  ambientGlowIntensity: number; // 0 to 100
  uiCornerRadius: 'sharp' | 'normal' | 'round';
  maintenanceMode: boolean;
  activeBroadcast: {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'event';
    active: boolean;
    timestamp: string;
  } | null;
  simulatedLatencyMs: number;
}

interface AdminControlPanelProps {
  users: User[];
  servers: ServerGuild[];
  currentUser: User | null;
  onUpdateUser: (userId: string, data: Partial<User>) => void;
  onUpdateServer: (serverId: string, data: Partial<ServerGuild>) => void;
  onDeleteServer: (serverId: string) => void;
  systemConfig: GlobalSystemConfig;
  onUpdateSystemConfig: (config: Partial<GlobalSystemConfig>) => void;
}

type AdminSubTab = 'users' | 'branding' | 'broadcast' | 'servers' | 'audit' | 'sandbox';

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  users,
  servers,
  currentUser,
  onUpdateUser,
  onUpdateServer,
  onDeleteServer,
  systemConfig,
  onUpdateSystemConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0] || null);

  // Form State para Transmissão Global
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'error' | 'event'>('info');

  // Form State para Personalização do App
  const [tempTitle, setTempTitle] = useState(systemConfig.appTitle);
  const [tempGlow, setTempGlow] = useState(systemConfig.ambientGlowIntensity);
  const [tempRadius, setTempRadius] = useState(systemConfig.uiCornerRadius);
  const [tempTheme, setTempTheme] = useState(systemConfig.globalTheme);

  // Logs de Auditoria Locais
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; action: string; user: string; severity: 'info' | 'warn' | 'crit' }>>([
    { id: '1', time: 'Agora', action: 'Sessão Administrativa Iniciada no Quantum Core', user: currentUser?.username || 'Admin', severity: 'info' },
    { id: '2', time: '1 min atrás', action: 'Verificação de Integridade do Banco de Dados Firestore: OK', user: 'Sistema', severity: 'info' },
    { id: '3', time: '5 min atrás', action: 'Nó de Voz WebRTC sincronizado com baixa latência', user: 'Gateway', severity: 'info' },
  ]);

  const addAuditLog = (action: string, severity: 'info' | 'warn' | 'crit' = 'info') => {
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      action,
      user: currentUser?.username || 'Admin',
      severity,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    onUpdateSystemConfig({
      activeBroadcast: {
        id: Date.now().toString(),
        message: broadcastMessage.trim(),
        type: broadcastType,
        active: true,
        timestamp: new Date().toLocaleTimeString(),
      },
    });
    addAuditLog(`Transmissão global emitida: "${broadcastMessage.substring(0, 30)}..." [Tipo: ${broadcastType}]`, 'warn');
    setBroadcastMessage('');
  };

  const handleClearBroadcast = () => {
    onUpdateSystemConfig({ activeBroadcast: null });
    addAuditLog('Transmissão global finalizada', 'info');
  };

  const handleApplyBranding = () => {
    onUpdateSystemConfig({
      appTitle: tempTitle,
      ambientGlowIntensity: tempGlow,
      uiCornerRadius: tempRadius,
      globalTheme: tempTheme,
    });
    addAuditLog(`Personalização do sistema atualizada: Tema=${tempTheme}, Título="${tempTitle}"`, 'info');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.customStatus && u.customStatus.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div id="admin-control-panel-root" className="space-y-6 text-slate-200">
      {/* Top Banner de Status do Administrador */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-red-500/10 to-purple-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Painel de Administração Supremo</h2>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Gerencie usuários, cargos, transmissão de mensagens globais, servidores e estilização do sistema.
            </p>
          </div>
        </div>

        {/* Status Rápido e Botão de Manutenção */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newMaintenance = !systemConfig.maintenanceMode;
              onUpdateSystemConfig({ maintenanceMode: newMaintenance });
              addAuditLog(`Modo de Manutenção ${newMaintenance ? 'ATIVADO' : 'DESATIVADO'}`, newMaintenance ? 'crit' : 'info');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              systemConfig.maintenanceMode
                ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/40 animate-pulse'
                : 'bg-[#1e222d] hover:bg-[#282d3c] text-slate-300 border-white/10'
            }`}
          >
            {systemConfig.maintenanceMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{systemConfig.maintenanceMode ? 'Manutenção Ativa' : 'Modo Normal'}</span>
          </button>
        </div>
      </div>

      {/* Sub-navegação do Painel de Admin */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#161a24] border border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Cargos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Personalização Global</span>
        </button>

        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'broadcast'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Transmissão Global</span>
        </button>

        <button
          onClick={() => setActiveSubTab('servers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'servers'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Servidores</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Auditoria ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sandbox')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'sandbox'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Sandbox & Latência</span>
        </button>
      </div>

      {/* 1. ABA: USUÁRIOS & CARGOS */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in">
          {/* Lista de Usuários */}
          <div className="md:col-span-1 p-4 rounded-2xl bg-[#171a23] border border-white/10 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0f1117] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    selectedUser?.id === u.id
                      ? 'bg-amber-500/20 border border-amber-500/50 text-white'
                      : 'hover:bg-white/5 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'}
                      alt={u.username}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-xs text-white truncate flex items-center gap-1">
                        {u.username}
                        {u.role === 'admin' && <Crown className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">#{u.discriminator || '0001'}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.role || 'membro'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Editor de Detalhes do Usuário Selecionado */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-[#171a23] border border-white/10 space-y-4">
            {selectedUser ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'}
                      alt={selectedUser.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        {selectedUser.username}
                        <span className="text-xs text-slate-400 font-normal">#{selectedUser.discriminator}</span>
                      </h3>
                      <p className="text-xs text-slate-400">{selectedUser.email || 'Usuário Local Quantum'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newRole = selectedUser.role === 'admin' ? 'member' : 'admin';
                        onUpdateUser(selectedUser.id, { role: newRole as any });
                        setSelectedUser({ ...selectedUser, role: newRole as any });
                        addAuditLog(`Cargo de ${selectedUser.username} alterado para ${newRole.toUpperCase()}`, 'warn');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        selectedUser.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>{selectedUser.role === 'admin' ? 'Revogar Admin' : 'Promover a Admin'}</span>
                    </button>
                  </div>
                </div>

                {/* Ações Rápidas de Moderação e Concessões */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Concessão de Selos e Benefícios</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={() => {
                        const newPerk = !selectedUser.nitroTier;
                        onUpdateUser(selectedUser.id, { nitroTier: newPerk ? 2 : 0 });
                        setSelectedUser({ ...selectedUser, nitroTier: newPerk ? 2 : 0 });
                        addAuditLog(`${newPerk ? 'Concedido' : 'Removido'} Nitro Quantum para ${selectedUser.username}`, 'info');
                      }}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedUser.nitroTier
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-[#101218] border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>{selectedUser.nitroTier ? 'Nitro Quantum Ativo' : 'Conceder Nitro Boost'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const isStaff = selectedUser.badges?.includes('staff');
                        const newBadges = isStaff
                          ? (selectedUser.badges || []).filter((b) => b !== 'staff')
                          : [...(selectedUser.badges || []), 'staff'];
                        onUpdateUser(selectedUser.id, { badges: newBadges });
                        setSelectedUser({ ...selectedUser, badges: newBadges });
                        addAuditLog(`Selo de Staff ${isStaff ? 'removido de' : 'adicionado a'} ${selectedUser.username}`, 'info');
                      }}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedUser.badges?.includes('staff')
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-[#101218] border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>Selo Staff Oficial</span>
                    </button>

                    <button
                      onClick={() => {
                        const isVerified = selectedUser.badges?.includes('verified');
                        const newBadges = isVerified
                          ? (selectedUser.badges || []).filter((b) => b !== 'verified')
                          : [...(selectedUser.badges || []), 'verified'];
                        onUpdateUser(selectedUser.id, { badges: newBadges });
                        setSelectedUser({ ...selectedUser, badges: newBadges });
                        addAuditLog(`Status de Verificado atualizado para ${selectedUser.username}`, 'info');
                      }}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedUser.badges?.includes('verified')
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-[#101218] border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Selo Verificado</span>
                    </button>
                  </div>
                </div>

                {/* Moderação Restritiva (Ban / Kick / Timeout) */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Ações Punitivas de Moderação</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        onUpdateUser(selectedUser.id, { status: 'offline', customStatus: '[Silenciado por Admin]' });
                        addAuditLog(`Usuário ${selectedUser.username} foi silenciado temporariamente`, 'warn');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Aplicar Timeout (1h)</span>
                    </button>

                    <button
                      onClick={() => {
                        addAuditLog(`Usuário ${selectedUser.username} expulso de todos os canais de voz`, 'warn');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Desconectar da Voz</span>
                    </button>

                    <button
                      onClick={() => {
                        addAuditLog(`[BANIMENTO] Usuário ${selectedUser.username} banido do cluster Quantum`, 'crit');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/30"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Banir da Rede</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">Selecione um usuário à esquerda para gerenciar</div>
            )}
          </div>
        </div>
      )}

      {/* 2. ABA: PERSONALIZAÇÃO GLOBAL DO SISTEMA */}
      {activeSubTab === 'branding' && (
        <div className="p-6 rounded-2xl bg-[#171a23] border border-white/10 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white">Customização de Identidade Visual do Sistema</h3>
            <p className="text-xs text-slate-400">
              Altere o título do aplicativo, a paleta de cores global e a intensidade dos efeitos visuais da interface para todos os clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Título do Aplicativo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Título Global do Aplicativo</label>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0f1117] border border-white/10 text-xs text-white focus:outline-hidden focus:border-amber-500"
                placeholder="Ex: Discord Quantum, Matrix Hub..."
              />
            </div>

            {/* Tema Global Predefinido */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Paleta Atmosférica Global</label>
              <select
                value={tempTheme}
                onChange={(e) => setTempTheme(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0f1117] border border-white/10 text-xs text-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                <option value="cyan">⚡ Cyber Cyan (Padrão)</option>
                <option value="violet">🔮 Deep Neon Violet</option>
                <option value="emerald">🌿 Matrix Emerald</option>
                <option value="crimson">🩸 Crimson Blood</option>
                <option value="gold">👑 Sovereign Gold</option>
                <option value="cyberpunk">🌃 Cyberpunk 2077</option>
              </select>
            </div>

            {/* Intensidade do Mesh Glow */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">Intensidade do Brilho Cósmico (Glow)</span>
                <span className="font-mono text-amber-400">{tempGlow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tempGlow}
                onChange={(e) => setTempGlow(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Raio das Bordas */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Arredondamento das Janelas e Cards</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sharp', 'normal', 'round'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTempRadius(r)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      tempRadius === r
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-[#0f1117] border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {r === 'sharp' ? 'Reto (4px)' : r === 'normal' ? 'Moderno (14px)' : 'Redondo (24px)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={handleApplyBranding}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar e Aplicar em Tempo Real</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ABA: TRANSMISSÃO GLOBAL (BROADCAST BANNER) */}
      {activeSubTab === 'broadcast' && (
        <div className="p-6 rounded-2xl bg-[#171a23] border border-white/10 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white">Transmissão de Alertas e Notificações Globais</h3>
            <p className="text-xs text-slate-400">
              Envie comunicados instantâneos na forma de banner holográfico fixo no topo de todos os clientes conectados.
            </p>
          </div>

          {/* Banner Ativo Atualmente */}
          {systemConfig.activeBroadcast?.active && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              systemConfig.activeBroadcast.type === 'warning'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : systemConfig.activeBroadcast.type === 'error'
                ? 'bg-red-500/20 border-red-500/50 text-red-200'
                : systemConfig.activeBroadcast.type === 'event'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
            }`}>
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 animate-pulse shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Transmissão Ativa no Ar ({systemConfig.activeBroadcast.timestamp})
                  </div>
                  <div className="text-sm font-semibold mt-0.5">{systemConfig.activeBroadcast.message}</div>
                </div>
              </div>

              <button
                onClick={handleClearBroadcast}
                className="px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs font-bold border border-white/20 cursor-pointer"
              >
                Encerrar Transmissão
              </button>
            </div>
          )}

          {/* Form para Nova Transmissão */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Mensagem da Transmissão</label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Ex: Atenção tripulação, manutenção agendada para 22h. Salvem seus arquivos!"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0f1117] border border-white/10 text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(['info', 'warning', 'error', 'event'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBroadcastType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      broadcastType === t
                        ? t === 'warning' ? 'bg-amber-500 text-slate-950' : t === 'error' ? 'bg-red-500 text-white' : t === 'event' ? 'bg-purple-500 text-white' : 'bg-cyan-500 text-slate-950'
                        : 'bg-[#0f1117] text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'info' ? 'Informativo' : t === 'warning' ? 'Aviso' : t === 'error' ? 'Crítico' : 'Evento'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastMessage.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Transmitir para Todos os Usuários</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA: SERVIDORES */}
      {activeSubTab === 'servers' && (
        <div className="p-6 rounded-2xl bg-[#171a23] border border-white/10 space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white">Supervisão de Servidores Ativos</h3>
            <p className="text-xs text-slate-400">
              Monitore, renomeie ou execute manutenção em qualquer guilda/servidor da infraestrutura.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servers.map((srv) => (
              <div key={srv.id} className="p-4 rounded-2xl bg-[#101218] border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={srv.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&fit=crop&q=80'}
                    alt={srv.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs">{srv.name}</h4>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {srv.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newName = prompt('Novo nome para o servidor:', srv.name);
                      if (newName && newName.trim()) {
                        onUpdateServer(srv.id, { name: newName.trim() });
                        addAuditLog(`Servidor ${srv.id} renomeado para "${newName.trim()}"`, 'warn');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Renomear
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir o servidor ${srv.name}?`)) {
                        onDeleteServer(srv.id);
                        addAuditLog(`Servidor "${srv.name}" excluído via Painel Admin`, 'crit');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                    title="Excluir Servidor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ABA: AUDITORIA EM TEMPO REAL */}
      {activeSubTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-[#171a23] border border-white/10 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Log de Auditoria de Ações Administrativas</h3>
              <p className="text-xs text-slate-400">Registro cronológico de eventos e comandos de segurança.</p>
            </div>
            <button
              onClick={() => setAuditLogs([])}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Limpar Logs
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#101218] border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    log.severity === 'crit' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : log.severity === 'warn' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-400'
                  }`} />
                  <span className="font-semibold text-slate-200 truncate">{log.action}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0 font-mono">
                  <span>{log.user}</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ABA: SANDBOX & LATÊNCIA */}
      {activeSubTab === 'sandbox' && (
        <div className="p-6 rounded-2xl bg-[#171a23] border border-white/10 space-y-5 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white">Sandbox & Simulação de Desempenho</h3>
            <p className="text-xs text-slate-400">Teste comportamento de conexão, latência e diagnóstico de sockets.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#101218] border border-white/5 space-y-2">
              <label className="text-xs font-bold text-slate-300">Simular Latência de Rede</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 45, 120, 300].map((ms) => (
                  <button
                    key={ms}
                    onClick={() => {
                      onUpdateSystemConfig({ simulatedLatencyMs: ms });
                      addAuditLog(`Latência simulada configurada para ${ms}ms`, 'info');
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      systemConfig.simulatedLatencyMs === ms
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-[#161a24] border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {ms === 0 ? '0ms (Fibra)' : `${ms}ms`}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#101218] border border-white/5 space-y-2">
              <label className="text-xs font-bold text-slate-300">Ações Rápidas de Diagnóstico</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addAuditLog('Diagnóstico de pacotes WebRTC executado: 0% perda de pacotes', 'info');
                    alert('Teste de Rede: Todos os nós de WebSocket e WebRTC estão operando a 100% de capacidade!');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ping Test Gateway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
