import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Laptop, Shield, Zap, Sparkles, ExternalLink, Download } from 'lucide-react';

interface WindowsTitlebarProps {
  appTitle?: string;
  onOpenWindowsAppModal: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
}

export const WindowsTitlebar: React.FC<WindowsTitlebarProps> = ({
  appTitle = 'Discord Quantum',
  onOpenWindowsAppModal,
  isAdmin = false,
  onOpenAdminPanel,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectronEnv, setIsElectronEnv] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detecta se está rodando dentro do executável Electron ou PWA Standalone
    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI) {
        setIsElectronEnv(true);
        (window as any).electronAPI.isMaximized().then((max: boolean) => setIsMaximized(max));
      }

      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setInstallPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      // Se já instalado ou em navegador que suporta instalação manual, abre o modal instrutivo
      onOpenWindowsAppModal();
    }
  };

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.maximize();
      setIsMaximized(!isMaximized);
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsMaximized(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsMaximized(false);
      }
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.close();
    } else {
      onOpenWindowsAppModal();
    }
  };

  return (
    <header
      id="windows-custom-titlebar"
      className="h-8 bg-[#070a14]/90 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-3 select-none z-40 text-xs shrink-0 w-full"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Lado Esquerdo: Logo, Nome do App e Badges */}
      <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-bold text-slate-200 text-xs tracking-tight">
            {appTitle}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 border-l border-white/10 pl-2.5">
          {!isInstalled && !isElectronEnv && (
            <button
              onClick={handleInstallPWA}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold transition-all cursor-pointer shadow-xs animate-pulse"
              title="Instalar Discord Quantum como aplicativo nativo no Windows (1-Clique)"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Instalar App no PC</span>
            </button>
          )}

          <button
            onClick={onOpenWindowsAppModal}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold transition-all cursor-pointer group shadow-xs"
            title="Abrir Hub do Aplicativo Executável para Windows (.exe)"
          >
            <Laptop className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>Windows Desktop (.exe)</span>
          </button>

          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer animate-pulse"
              title="Painel de Administração Supremo"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Supremo</span>
            </button>
          )}
        </div>
      </div>

      {/* Centro: Título Sutil da Janela */}
      <div className="text-[11px] font-medium text-slate-400/80 truncate max-w-[280px] hidden md:block">
        {isElectronEnv ? 'Discord Quantum — Windows 64-bit Nativo' : 'Discord Quantum — Interface Desktop'}
      </div>

      {/* Lado Direito: Botões de Janela Nativos do Windows 11 */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          id="btn-win-minimize"
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-win-maximize"
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title={isMaximized ? 'Restaurar Tamanho' : 'Maximizar'}
        >
          <Square className="w-3 h-3" />
        </button>

        <button
          id="btn-win-close"
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#e81123] transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
