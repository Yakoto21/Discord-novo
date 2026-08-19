import React, { useState, useRef } from 'react';
import { 
  X, Upload, Sparkles, Gamepad2, Users, GraduationCap, 
  Image as ImageIcon, Link as LinkIcon, Check, Trash2, AlertCircle 
} from 'lucide-react';
import { ServerGuild } from '../../types';
import { PRESET_SERVER_ICONS, compressImageFile } from '../../utils/imageUtils';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateServer: (serverData: Partial<ServerGuild>) => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  isOpen,
  onClose,
  onCreateServer,
}) => {
  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [serverName, setServerName] = useState('');
  const [serverIcon, setServerIcon] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (templateName: string) => {
    setServerName(`Servidor de ${templateName}`);
    setStep('customize');
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione uma imagem válida (PNG, JPG, WebP ou GIF).');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 400);
      setServerIcon(compressedDataUrl);
      setUrlInput('');
    } catch (err: any) {
      setUploadError('Não foi possível processar a imagem selecionada.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFileChange(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setServerIcon(urlInput.trim());
      setUploadError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    const acronym = serverName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 3)
      .toUpperCase() || 'SRV';

    onCreateServer({
      name: serverName.trim(),
      acronym,
      iconUrl:
        serverIcon ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      description: 'Servidor criado pela comunidade.',
      memberCount: 1,
    });

    // Reset
    setServerName('');
    setServerIcon('');
    setUrlInput('');
    setShowUrlField(false);
    setUploadError(null);
    setStep('template');
    onClose();
  };

  return (
    <div 
      id="create-server-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        id="create-server-card"
        className="bg-[#2b2d31] w-full max-w-md rounded-2xl shadow-2xl border border-[#3f4147] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Cabeçalho */}
        <div className="p-6 pb-2 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white p-1.5 rounded-full hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-white">
            {step === 'template' ? 'Criar um Servidor' : 'Personalize seu Servidor'}
          </h2>
          <p className="text-xs text-[#949ba4] mt-1.5 leading-relaxed">
            {step === 'template'
              ? 'Seu servidor é onde você e seus amigos se reúnem. Crie o seu e comece a conversar!'
              : 'Dê uma personalidade ao seu novo servidor com um nome e uma foto de perfil.'}
          </p>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 pt-3">
          {step === 'template' ? (
            <div className="space-y-2.5">
              <button
                onClick={() => handleSelectTemplate('Amigos')}
                className="w-full bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] p-3 rounded-xl flex items-center justify-between text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5865f2] flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#5865f2]">
                      Criar o Meu
                    </div>
                    <div className="text-[11px] text-[#949ba4]">Para mim e meus amigos</div>
                  </div>
                </div>
                <span className="text-xs text-[#949ba4] group-hover:translate-x-1 transition-transform">
                  ➔
                </span>
              </button>

              <button
                onClick={() => handleSelectTemplate('Jogos')}
                className="w-full bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] p-3 rounded-xl flex items-center justify-between text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#23a55a] flex items-center justify-center text-white">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#23a55a]">
                      Jogos & Gaming
                    </div>
                    <div className="text-[11px] text-[#949ba4]">Com canais de squad e clipes</div>
                  </div>
                </div>
                <span className="text-xs text-[#949ba4] group-hover:translate-x-1 transition-transform">
                  ➔
                </span>
              </button>

              <button
                onClick={() => handleSelectTemplate('Estudos')}
                className="w-full bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] p-3 rounded-xl flex items-center justify-between text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0b232] flex items-center justify-center text-white">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#f0b232]">
                      Clube Escolar ou Faculdade
                    </div>
                    <div className="text-[11px] text-[#949ba4]">Para grupos de estudo e projetos</div>
                  </div>
                </div>
                <span className="text-xs text-[#949ba4] group-hover:translate-x-1 transition-transform">
                  ➔
                </span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input de Arquivo Oculto */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Área de Upload de Foto do Servidor */}
              <div className="flex flex-col items-center justify-center">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all group ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/20 scale-105'
                      : serverIcon
                      ? 'border-[#5865f2] bg-[#1e1f22]'
                      : 'border-[#5865f2]/80 bg-[#1e1f22] hover:border-white hover:bg-[#313338]'
                  }`}
                  title="Clique para escolher foto do seu computador ou celular"
                >
                  {isCompressing ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-1" />
                      <span className="text-[9px] font-bold text-cyan-300">Processando...</span>
                    </div>
                  ) : serverIcon ? (
                    <>
                      <img src={serverIcon} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                        <Upload className="w-5 h-5 mb-0.5 text-cyan-300" />
                        <span className="text-[9px] font-bold uppercase">Trocar Foto</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-[#5865f2]/20 flex items-center justify-center text-[#5865f2] group-hover:text-white group-hover:bg-[#5865f2] transition-colors mb-1">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-[#dbdee1] uppercase tracking-wider">
                        ENVIAR FOTO
                      </span>
                      <span className="text-[8px] text-[#949ba4] font-medium">PNG, JPG, GIF</span>
                    </>
                  )}
                </div>

                {/* Opções auxiliares de foto */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#5865f2] hover:text-[#7983f5] hover:underline cursor-pointer"
                  >
                    Escolher do PC
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setShowUrlField(!showUrlField)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Usar Link Web</span>
                  </button>
                  {serverIcon && (
                    <>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setServerIcon('');
                          setUrlInput('');
                        }}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Mensagem de Erro */}
                {uploadError && (
                  <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/40">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Campo de Inserção de Link URL Direto */}
                {showUrlField && (
                  <div className="w-full mt-3 p-2.5 rounded-xl bg-[#1e1f22] border border-slate-700/60">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Cole a URL da Imagem na Web:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="flex-1 bg-[#111214] text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-[#5865f2]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                {/* Galeria de Fotos / Ícones Temáticos Pré-definidos */}
                <div className="w-full mt-3 pt-3 border-t border-[#383a40]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Ou escolha um ícone temático pronto:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_SERVER_ICONS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setServerIcon(preset.url);
                          setUploadError(null);
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                          serverIcon === preset.url
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                            : 'border-transparent hover:border-white/50 opacity-70 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                        {serverIcon === preset.url && (
                          <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nome do Servidor */}
              <div>
                <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider mb-2">
                  Nome do Servidor
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Meu Servidor Incrível"
                  required
                  className="w-full bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-lg outline-none border border-[#232428] focus:border-[#5865f2]"
                />
              </div>

              <div className="text-[11px] text-[#949ba4]">
                Ao criar um servidor, você concorda com as Diretrizes da Comunidade do Discord.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('template')}
                  className="text-xs font-semibold text-white hover:underline cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={!serverName.trim() || isCompressing}
                  className="bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Criar Servidor
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
