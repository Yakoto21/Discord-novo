import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  Trash2,
  Upload,
  Users,
  Smile,
  Zap,
  Check,
  AlertTriangle,
  Palette,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { ServerGuild, ServerTheme } from '../../types';
import { PRESET_SERVER_THEMES } from '../../data/themes';
import { PRESET_SERVER_ICONS, PRESET_SERVER_BANNERS, compressImageFile } from '../../utils/imageUtils';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: ServerGuild | null;
  onUpdateServer: (updated: Partial<ServerGuild>) => void;
  onDeleteServer?: (serverId: string) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  server,
  onUpdateServer,
  onDeleteServer,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'roles' | 'emojis'>('overview');
  const [name, setName] = useState(server?.name || '');
  const [description, setDescription] = useState(server?.description || '');
  const [iconUrl, setIconUrl] = useState(server?.iconUrl || '');
  const [bannerUrl, setBannerUrl] = useState(server?.bannerUrl || '');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(server?.theme?.id || 'cyber-cyan');
  const [saved, setSaved] = useState(false);

  // Estados de Upload de Imagem
  const [isIconDragging, setIsIconDragging] = useState(false);
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showIconUrlField, setShowIconUrlField] = useState(false);
  const [showBannerUrlField, setShowBannerUrlField] = useState(false);

  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (server) {
      setName(server.name || '');
      setDescription(server.description || '');
      setIconUrl(server.iconUrl || '');
      setBannerUrl(server.bannerUrl || '');
      setSelectedThemeId(server.theme?.id || 'cyber-cyan');
      setSaved(false);
      setUploadError(null);
    }
  }, [server, isOpen]);

  if (!isOpen || !server) return null;

  const handleIconFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione uma imagem válida (PNG, JPG, WebP ou GIF).');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 400);
      setIconUrl(compressedDataUrl);
    } catch (err) {
      setUploadError('Falha ao processar arquivo de imagem local.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleBannerFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione uma imagem de banner válida (PNG, JPG, WebP ou GIF).');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 0.85);
      setBannerUrl(compressedDataUrl);
    } catch (err) {
      setUploadError('Falha ao processar banner local.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenTheme = PRESET_SERVER_THEMES[selectedThemeId] || PRESET_SERVER_THEMES['cyber-cyan'];
    onUpdateServer({
      name,
      description,
      iconUrl,
      bannerUrl,
      theme: chosenTheme,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div 
      id="server-settings-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div 
        id="server-settings-card"
        className="bg-[#1e2024] w-full max-w-4xl h-[86vh] rounded-3xl shadow-2xl border border-[#2e3136] flex overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Menu Lateral das Configurações do Servidor */}
        <div className="w-60 bg-[#16171a] p-4 flex flex-col justify-between border-r border-[#26282c] shrink-0 select-none">
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase text-slate-400 px-2.5 mb-3 tracking-wider truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{server.name}</span>
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/60'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Visão Geral & Fotos</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/60'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4 text-fuchsia-400" />
              <span>Temas & Estilização</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/60'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Cargos & Segurança</span>
            </button>

            <button
              onClick={() => setActiveTab('emojis')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'emojis'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/60'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Smile className="w-4 h-4 text-amber-400" />
              <span>Emojis & Stickers</span>
            </button>
          </div>

          {onDeleteServer && (
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja deletar permanentemente o servidor ${server.name}?`)) {
                  onDeleteServer(server.id);
                  onClose();
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-all cursor-pointer border border-rose-900/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Servidor</span>
            </button>
          )}
        </div>

        {/* Painel Central */}
        <div className="flex-1 flex flex-col bg-[#1e2024] overflow-y-auto p-6 sm:p-8 relative">
          {/* Botão Fechar */}
          <div className="absolute top-6 right-6 flex flex-col items-center z-10">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-slate-500 mt-1 font-mono font-bold">ESC</span>
          </div>

          {/* Inputs ocultos de arquivos */}
          <input
            type="file"
            ref={iconFileInputRef}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleIconFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <input
            type="file"
            ref={bannerFileInputRef}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleBannerFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* ABA 1: Visão Geral e Fotos */}
          {activeTab === 'overview' && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Visão Geral & Foto do Servidor</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Personalize o ícone, banner, nome e descrição da sua comunidade.
                </p>
              </div>

              {uploadError && (
                <div className="text-xs text-rose-400 flex items-center gap-2 bg-rose-950/40 p-3 rounded-xl border border-rose-800/40">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* 1. SEÇÃO DE FOTO / ÍCONE DO SERVIDOR */}
                <div className="p-4 rounded-2xl bg-[#16171a] border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                      Ícone do Servidor
                    </label>
                    <span className="text-[11px] text-slate-400">Recomendado: 512x512 ou superior</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Botão / Dropzone do Ícone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsIconDragging(true);
                      }}
                      onDragLeave={() => setIsIconDragging(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setIsIconDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          await handleIconFileChange(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => iconFileInputRef.current?.click()}
                      className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed cursor-pointer group shrink-0 transition-all flex items-center justify-center ${
                        isIconDragging
                          ? 'border-cyan-400 bg-cyan-500/20 scale-105'
                          : iconUrl
                          ? 'border-slate-700 bg-slate-900'
                          : 'border-slate-700 hover:border-cyan-400 bg-slate-900'
                      }`}
                      title="Clique para escolher foto do computador ou arraste aqui"
                    >
                      {isCompressing ? (
                        <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : iconUrl ? (
                        <>
                          <img src={iconUrl} alt="Server Icon" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                            <Upload className="w-5 h-5 mb-1 text-cyan-300" />
                            <span className="text-[9px] font-bold uppercase">Trocar Foto</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-cyan-300">
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-[9px] font-bold uppercase">Upload</span>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação do Ícone */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => iconFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Carregar do Computador</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowIconUrlField(!showIconUrlField)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Link Web</span>
                        </button>

                        {iconUrl && (
                          <button
                            type="button"
                            onClick={() => setIconUrl('')}
                            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>

                      {showIconUrlField && (
                        <div className="pt-1">
                          <input
                            type="url"
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                            placeholder="https://exemplo.com/icone.png"
                            className="w-full bg-[#111214] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Galeria de Ícones Rápidos */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Galeria de Ícones Prontos:</span>
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_SERVER_ICONS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setIconUrl(preset.url)}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                            iconUrl === preset.url
                              ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                              : 'border-transparent hover:border-slate-500 opacity-70 hover:opacity-100'
                          }`}
                          title={preset.label}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          {iconUrl === preset.url && (
                            <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. SEÇÃO DE BANNER DO SERVIDOR */}
                <div className="p-4 rounded-2xl bg-[#16171a] border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                      Banner de Fundo do Servidor
                    </label>
                    <span className="text-[11px] text-slate-400">Exibido no topo dos canais</span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsBannerDragging(true);
                    }}
                    onDragLeave={() => setIsBannerDragging(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsBannerDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        await handleBannerFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => bannerFileInputRef.current?.click()}
                    className={`relative w-full h-28 rounded-2xl overflow-hidden border-2 border-dashed cursor-pointer group transition-all flex items-center justify-center ${
                      isBannerDragging
                        ? 'border-cyan-400 bg-cyan-500/20 scale-[1.01]'
                        : bannerUrl
                        ? 'border-slate-700'
                        : 'border-slate-700 hover:border-cyan-400 bg-slate-900'
                    }`}
                    title="Clique para escolher foto de banner ou arraste aqui"
                  >
                    {bannerUrl ? (
                      <>
                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white transition-opacity">
                          <Upload className="w-4 h-4 text-cyan-300" />
                          <span className="text-xs font-bold">Trocar Banner</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-cyan-300">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold">Enviar Foto de Banner</span>
                        <span className="text-[10px] text-slate-500">Clique ou arraste um arquivo de imagem</span>
                      </div>
                    )}
                  </div>

                  {/* Banners Pré-definidos */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Banners rápidos:</span>
                    {PRESET_SERVER_BANNERS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBannerUrl(b.url)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        {b.label}
                      </button>
                    ))}
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="text-[10px] px-2 py-1 rounded-lg text-rose-400 hover:underline ml-auto cursor-pointer"
                      >
                        Remover Banner
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. NOME E DESCRIÇÃO */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nome do Servidor
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#16171a] text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Descrição da Comunidade
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte sobre seu servidor..."
                    className="w-full bg-[#16171a] text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                  >
                    {saved && <Check className="w-4 h-4" />}
                    <span>{saved ? 'Alterações Salvas com Sucesso!' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ABA 2: Temas Dinâmicos por Servidor */}
          {activeTab === 'themes' && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-fuchsia-400" />
                  <h2 className="text-xl font-bold text-white">Motor de Temas Dinâmicos</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Defina a identidade visual exclusiva deste servidor. Quando qualquer membro navegar por este servidor, toda a interface assume a paleta personalizada.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Object.values(PRESET_SERVER_THEMES).map((thm) => (
                  <div
                    key={thm.id}
                    onClick={() => setSelectedThemeId(thm.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      selectedThemeId === thm.id
                        ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/40'
                        : 'bg-[#16171a] border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {/* Header do Tema */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {thm.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{thm.description || 'Tema espacial'}</div>
                      </div>
                      {selectedThemeId === thm.id && (
                        <span className="p-1 rounded-full bg-cyan-500 text-slate-950">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Paleta de Cores em Pílulas */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                        style={{ backgroundColor: thm.primaryColor || thm.primary || '#06b6d4' }}
                        title="Primary Color"
                      />
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                        style={{ backgroundColor: thm.accentColor || thm.accent || '#8b5cf6' }}
                        title="Accent Color"
                      />
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                        style={{ backgroundColor: thm.sidebarBg ? '#0b0f19' : '#04060c' }}
                        title="Sidebar Background"
                      />
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                        style={{ backgroundColor: thm.chatBg || thm.appBg || '#080a12' }}
                        title="Chat Background"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Tema Selecionado: <span className="text-cyan-400 font-bold">{PRESET_SERVER_THEMES[selectedThemeId]?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                >
                  {saved && <Check className="w-4 h-4" />}
                  <span>{saved ? 'Tema Aplicado!' : 'Aplicar Tema ao Servidor'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 3: Cargos */}
          {activeTab === 'roles' && (
            <div className="max-w-xl space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-bold text-white">Cargos e Permissões</h2>
              <div className="space-y-2">
                {[
                  { name: 'Administrador Blindado', color: '#06b6d4', members: 2 },
                  { name: 'Moderador Tech', color: '#a855f7', members: 6 },
                  { name: 'Full-Stack Developer', color: '#10b981', members: 340 },
                  { name: '@everyone', color: '#949ba4', members: server.memberCount || 100 },
                ].map((role) => (
                  <div
                    key={role.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#16171a] border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-xs font-bold text-white">{role.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{role.members} membros</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 4: Emojis */}
          {activeTab === 'emojis' && (
            <div className="max-w-xl space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-bold text-white">Emojis & Reações do Servidor</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {['🚀', '🛡️', '⚡', '💻', '🔥', '🧠', '🎧', '👾', '💎', '🎉', '☕', '🌟'].map((emoji, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#16171a] border border-slate-800 flex items-center justify-center text-2xl hover:scale-110 hover:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
