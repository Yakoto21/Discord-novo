import React, { useState } from 'react';
import {
  Cast,
  Tv,
  Monitor,
  Sparkles,
  Sliders,
  Volume2,
  X,
  Play,
  Layers,
  Cpu,
} from 'lucide-react';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScreenShare: (options: {
    resolution: '720p' | '1080p' | '1440p' | '4k';
    fps: 30 | 60;
    captureAudio: boolean;
    forceVirtual?: boolean;
  }) => void;
  isAlreadySharing: boolean;
}

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  onStartScreenShare,
  isAlreadySharing,
}) => {
  const [streamSource, setStreamSource] = useState<'native' | 'virtual'>('native');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4k'>('1080p');
  const [fps, setFps] = useState<30 | 60>(60);
  const [captureAudio, setCaptureAudio] = useState(true);

  if (!isOpen) return null;

  const handleStart = () => {
    onStartScreenShare({
      resolution,
      fps,
      captureAudio,
      forceVirtual: streamSource === 'virtual',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-[2.5rem] p-6 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden text-slate-200">
        {/* Luz decorativa */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Cast className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                Transmitir Sua Tela
              </h2>
              <p className="text-xs text-slate-400">
                Compartilhe jogos, aplicativos, janelas ou seu ambiente de desenvolvimento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white glass-dock rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seleção do Modo de Origem */}
        <div className="space-y-4 my-5 relative z-10">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 block">
              Origem da Transmissão
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStreamSource('native')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                  streamSource === 'native'
                    ? 'bg-cyan-500/20 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white'
                    : 'glass-dock border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                <Monitor className={`w-6 h-6 ${streamSource === 'native' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Captura do Sistema</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Telas, Janelas de Apps e Guias
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStreamSource('virtual')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                  streamSource === 'virtual'
                    ? 'bg-violet-500/20 border-violet-400/60 shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white'
                    : 'glass-dock border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                <Cpu className={`w-6 h-6 ${streamSource === 'virtual' ? 'text-violet-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Quantum Dev Studio (60 FPS)</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Simulador de código e telemetria WebRTC
                </span>
              </button>
            </div>
          </div>

          {/* Qualidade e Resolução */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 block">
              Resolução de Vídeo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['720p', '1080p', '1440p', '4k'] as const).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    resolution === res
                      ? 'bg-white/20 border-white/40 text-white shadow-md'
                      : 'glass-dock border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {res.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Taxa de Quadros (FPS) */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 block">
              Taxa de Quadros (FPS)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFps(30)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  fps === 30
                    ? 'bg-white/20 border-white/40 text-white shadow-md'
                    : 'glass-dock border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                30 FPS (Modo Fluido Padrão)
              </button>

              <button
                type="button"
                onClick={() => setFps(60)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  fps === 60
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'glass-dock border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>60 FPS (Ultra Suave)</span>
              </button>
            </div>
          </div>

          {/* Áudio do Sistema */}
          <div className="p-3 rounded-2xl glass-dock border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div className="text-xs">
                <div className="font-bold text-white">Áudio do Sistema e Aplicativos</div>
                <div className="text-[10px] text-slate-400">
                  Transmita o som do jogo/vídeo junto com o seu microfone
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={captureAudio}
              onChange={(e) => setCaptureAudio(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 cursor-pointer rounded"
            />
          </div>
        </div>

        {/* Rodapé e Botão de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isAlreadySharing ? 'Reiniciar Transmissão' : 'Transmitir Ao Vivo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
