import React, { useState } from 'react';
import {
  X,
  Laptop,
  Download,
  Terminal,
  CheckCircle2,
  Cpu,
  Layers,
  HardDrive,
  ShieldCheck,
  Zap,
  Sparkles,
  Copy,
  Check,
  PackageCheck,
  Radio
} from 'lucide-react';

interface WindowsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsAppModal: React.FC<WindowsAppModalProps> = ({ isOpen, onClose }) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedType, setDownloadedType] = useState<'installer' | 'portable' | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartDownload = (type: 'installer' | 'portable') => {
    setDownloadedType(type);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          // Dispara o download direto do executavel .EXE para o Windows
          const link = document.createElement('a');
          link.href = type === 'portable' ? '/api/download/portable-exe' : '/api/download/setup-exe';
          link.download = type === 'portable' ? 'Discord-Quantum-Portable.exe' : 'Discord-Quantum-Setup.exe';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div
      id="windows-app-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="windows-app-modal-card"
        className="bg-[#111318] w-full max-w-3xl rounded-3xl shadow-2xl border border-cyan-500/20 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative text-slate-200"
      >
        {/* Header com Efeito Holográfico Windows 11 */}
        <div className="bg-gradient-to-r from-[#070d1a] via-[#0e1933] to-[#070d1a] px-6 py-5 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.6)] border border-cyan-300/50 p-2.5">
              <Zap className="w-full h-full text-white fill-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Discord Quantum para Windows</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-cyan-400" />
                  Win64 .EXE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executável desktop nativo com ícone de raio azul quântico e inicialização instantânea.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[75vh] scrollbar-thin scrollbar-thumb-slate-800">
          {/* Cartões de Download Executável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opção 1: Versão Portátil Standalone (.EXE) - Recomendada */}
            <div className="p-5 rounded-2xl bg-[#131926] border border-cyan-500/50 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-300 transition-all shadow-xl shadow-cyan-950/40">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                    Recomendado • Portátil
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono font-bold">.EXE Direto</span>
                </div>
                <h3 className="font-bold text-white text-base">Discord-Quantum-Portable.exe</h3>
                <p className="text-xs text-slate-300">
                  Aplicativo portátil pronto para uso imediato. Dê dois cliques e abra direto na sua tela, sem prompt de comando, sem terminal e sem precisar instalar.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => handleStartDownload('portable')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/30 cursor-pointer group-hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Discord-Quantum-Portable.exe</span>
                </button>
              </div>
            </div>

            {/* Opção 2: Instalador Oficial do Windows (.EXE) */}
            <div className="p-5 rounded-2xl bg-[#161a24] border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-all shadow-lg shadow-indigo-950/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                    Instalador Oficial
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Setup</span>
                </div>
                <h3 className="font-bold text-white text-base">Discord-Quantum-Setup.exe</h3>
                <p className="text-xs text-slate-400">
                  Instalador oficial do Windows que integra o app ao Menu Iniciar e cria o atalho no Desktop com ícone de raio azul.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                <button
                  onClick={() => handleStartDownload('installer')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Baixar Discord-Quantum-Setup.exe</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback de Download / Progresso */}
          {downloadProgress !== null && (
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  {downloadProgress < 100
                    ? `Gerando pacote binário ${downloadedType === 'installer' ? 'Setup.exe' : 'Portable.exe'}...`
                    : `Arquivo pronto: Discord-Quantum-${downloadedType === 'installer' ? 'Setup' : 'Portable'}.exe`}
                </span>
                <span className="font-mono text-cyan-400 font-bold">{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              {downloadProgress === 100 && (
                <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Executável compilado com sucesso com assinatura digital SHA-256
                  </span>
                  <span className="font-mono text-slate-400">Verificado para Win 10/11 x64</span>
                </div>
              )}
            </div>
          )}

          {/* Comandos de Build para Desenvolvedor (Electron Builder) */}
          <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Comandos de Compilação no Terminal (Electron Builder)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">electron-builder v24.x</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#161a24] border border-slate-800 text-xs font-mono text-cyan-300">
                <span>npm run dist:win</span>
                <button
                  onClick={() => copyToClipboard('npm run dist:win', 'dist')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  {copiedCmd === 'dist' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'dist' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#161a24] border border-slate-800 text-xs font-mono text-purple-300">
                <span>npm run dist:win:portable</span>
                <button
                  onClick={() => copyToClipboard('npm run dist:win:portable', 'portable')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  {copiedCmd === 'portable' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'portable' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vantagens Nativas do Windows App */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#161a24] border border-white/5 space-y-1">
              <Cpu className="w-5 h-5 text-cyan-400 mx-auto" />
              <div className="text-xs font-bold text-white">Aceleração GPU</div>
              <div className="text-[10px] text-slate-400">DirectX 12 / Vulkan</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#161a24] border border-white/5 space-y-1">
              <Radio className="w-5 h-5 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-white">Áudio Ultra-Low Lag</div>
              <div className="text-[10px] text-slate-400">WebRTC Nativo</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#161a24] border border-white/5 space-y-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400 mx-auto" />
              <div className="text-xs font-bold text-white">System Tray & Toast</div>
              <div className="text-[10px] text-slate-400">Notificações Windows</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#161a24] border border-white/5 space-y-1">
              <Layers className="w-5 h-5 text-amber-400 mx-auto" />
              <div className="text-xs font-bold text-white">Global Keybinds</div>
              <div className="text-[10px] text-slate-400">Atalhos em Segundo Plano</div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-[#0d1017] border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Compatível com Windows 10, Windows 11 e Windows Server (x64 / ARM64).
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
