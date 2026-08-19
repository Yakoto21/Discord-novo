import React from 'react';
import { PhoneOff, Signal, Volume2, MicOff, Share2, Cast } from 'lucide-react';
import { Channel } from '../../types';

interface ActiveVoiceBarProps {
  voiceChannel: Channel;
  isMuted: boolean;
  isScreenSharing?: boolean;
  onReturnToVoice: () => void;
  onDisconnect: () => void;
}

export const ActiveVoiceBar: React.FC<ActiveVoiceBarProps> = ({
  voiceChannel,
  isMuted,
  isScreenSharing,
  onReturnToVoice,
  onDisconnect,
}) => {
  return (
    <div
      id="active-voice-floating-bar"
      className="glass-dock rounded-2xl mx-3 mb-2 p-2.5 flex items-center justify-between z-30 shadow-2xl border border-emerald-500/30"
    >
      <div
        onClick={onReturnToVoice}
        className="flex items-center gap-3 cursor-pointer group transition-all"
        title="Clique para regressar ao Holo-Stage de Voz"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          <Signal className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="text-xs font-black text-emerald-400 leading-none flex items-center gap-1.5 uppercase tracking-wider">
            <span>Frequência Conectada</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">/ RTC P2P</span>
          </div>
          <div className="text-xs text-slate-200 group-hover:text-white flex items-center gap-1.5 mt-1">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold truncate max-w-[180px]">{voiceChannel.name}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isScreenSharing && (
          <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Cast className="w-3 h-3" /> Transmitindo
          </span>
        )}

        {isMuted && (
          <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <MicOff className="w-3 h-3" /> Mutado
          </span>
        )}

        <button
          onClick={onReturnToVoice}
          className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all cursor-pointer shadow-md"
          title="Ver Transmissão / Holo-Stage"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-quick-disconnect-voice"
          onClick={onDisconnect}
          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
          title="Encerrar chamada de voz"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
