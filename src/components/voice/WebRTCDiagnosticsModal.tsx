import React, { useState, useEffect } from 'react';
import {
  Activity,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  X,
  Radio,
  Wifi,
  Cast,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { WebRTCDiagnosticReport } from '../../types';

interface WebRTCDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  getDiagnostics?: () => WebRTCDiagnosticReport;
  onLogDiagnostics?: () => WebRTCDiagnosticReport;
}

export const WebRTCDiagnosticsModal: React.FC<WebRTCDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  getDiagnostics,
  onLogDiagnostics,
}) => {
  const [report, setReport] = useState<WebRTCDiagnosticReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [loggedNotification, setLoggedNotification] = useState(false);

  const refreshData = () => {
    if (getDiagnostics) {
      setReport(getDiagnostics());
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshData();
    const interval = setInterval(refreshData, 1200);
    return () => clearInterval(interval);
  }, [isOpen, getDiagnostics]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogConsole = () => {
    if (onLogDiagnostics) {
      const loggedReport = onLogDiagnostics();
      setReport(loggedReport);
    } else if (getDiagnostics) {
      const current = getDiagnostics();
      console.log('[WebRTC Diagnostics Snapshot]', current);
      setReport(current);
    }
    setLoggedNotification(true);
    setTimeout(() => setLoggedNotification(false), 2500);
  };

  const getSignalingColor = (state?: string) => {
    switch (state) {
      case 'stable':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'have-local-offer':
      case 'have-remote-offer':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 animate-pulse';
      case 'closed':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  const getIceColor = (state?: string) => {
    switch (state) {
      case 'connected':
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'checking':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 animate-pulse';
      case 'failed':
      case 'disconnected':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Painel de Diagnóstico WebRTC & Handshake
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Monitoramento em tempo real do estado de sinalização, candidatos ICE e envio de faixas de mídia.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogConsole}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-md cursor-pointer text-xs"
              >
                <Terminal className="w-4 h-4" />
                <span>Imprimir no Console DevTools</span>
              </button>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all border border-white/10 cursor-pointer text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <button
                onClick={refreshData}
                className="flex items-center gap-1 hover:text-cyan-300 transition-all cursor-pointer"
                title="Atualizar agora"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
              <span>•</span>
              <span className="font-mono text-slate-500">
                {report ? new Date(report.timestamp).toLocaleTimeString() : '--:--:--'}
              </span>
            </div>
          </div>

          {loggedNotification && (
            <div className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in text-xs font-semibold">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Snapshot WebRTC impresso com sucesso no Console! Pressione F12 para inspecionar as tabelas.</span>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Pares Conectados
              </span>
              <span className="text-xl font-black text-white font-mono">{report?.peerCount || 0}</span>
              <span className="text-[10px] text-slate-500">RTCPeerConnection(s)</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Faixas Enviadas
              </span>
              <span className="text-xl font-black text-indigo-300 font-mono">
                {report?.local.tracks.length || 0}
              </span>
              <span className="text-[10px] text-slate-500">
                {report?.local.audioTracks || 0} áudio, {report?.local.videoTracks || 0} vídeo
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Cast className="w-3.5 h-3.5 text-cyan-400" />
                Tela Compartilhada
              </span>
              <span
                className={`text-sm font-bold font-mono px-2 py-0.5 rounded w-fit ${
                  report?.screenShare.isScreenSharing
                    ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
                    : 'text-slate-400 bg-slate-800'
                }`}
              >
                {report?.screenShare.isScreenSharing ? 'TRANSMITINDO' : 'INATIVO'}
              </span>
              <span className="text-[10px] text-slate-500">
                {report?.screenShare.tracksCount || 0} track(s) ativa(s)
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Canal de Voz
              </span>
              <span className="text-sm font-bold text-slate-200 truncate font-mono">
                {report?.activeVoiceChannelId || 'Desconectado'}
              </span>
              <span className="text-[10px] text-slate-500">
                {report?.state.participantsCount || 0} participante(s)
              </span>
            </div>
          </div>

          {/* Screen Share Handshake Pipeline Visualizer */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Cast className="w-4 h-4 text-cyan-400" />
              Pipeline de Handshake da Transmissão de Tela
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  report?.screenShare.hasScreenStream
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    report?.screenShare.hasScreenStream ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-[11px]">1. getDisplayMedia</div>
                  <div className="text-[10px] opacity-80">Stream obtido</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  report?.screenShare.tracksCount ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    report?.screenShare.tracksCount ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-[11px]">2. Faixa de Vídeo</div>
                  <div className="text-[10px] opacity-80">Live & Habilitada</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  report?.local.videoTracks ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    report?.local.videoTracks ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-[11px]">3. Senders Injetados</div>
                  <div className="text-[10px] opacity-80">replaceTrack / addTrack</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  report?.screenShare.isScreenSharing
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    report?.screenShare.isScreenSharing ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-[11px]">4. Sinalização Socket</div>
                  <div className="text-[10px] opacity-80">voice:state-update</div>
                </div>
              </div>
            </div>
          </div>

          {/* RTCPeerConnections Detailed Table */}
          <div className="bg-slate-950/70 rounded-xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Instâncias RTCPeerConnection ({report?.peers.length || 0})
              </h3>
            </div>

            {report?.peers && report.peers.length > 0 ? (
              <div className="divide-y divide-white/5">
                {report.peers.map((peer, idx) => (
                  <div key={peer.socketId} className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          Peer #{idx + 1}: {peer.socketId}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${getSignalingColor(
                            peer.signalingState
                          )}`}
                        >
                          Signaling: {peer.signalingState}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${getIceColor(
                            peer.iceConnectionState
                          )}`}
                        >
                          ICE: {peer.iceConnectionState}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-white/10 text-slate-300 text-[10px] font-mono">
                          Conn: {peer.connectionState}
                        </span>
                      </div>
                    </div>

                    {/* Senders & Receivers breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 space-y-1.5">
                        <div className="font-bold text-slate-300 flex items-center justify-between">
                          <span>Senders (Faixas Enviadas):</span>
                          <span className="text-cyan-400 font-mono">{peer.sendersCount}</span>
                        </div>
                        {peer.senders.length > 0 ? (
                          <div className="space-y-1">
                            {peer.senders.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center justify-between font-mono text-[10px] bg-slate-950/50 px-2 py-1 rounded"
                              >
                                <span className="text-cyan-300 font-bold uppercase">{s.kind}</span>
                                <span className="text-slate-400 truncate max-w-[150px]">{s.id || 'sem track'}</span>
                                <span className={s.readyState === 'live' ? 'text-emerald-400' : 'text-slate-500'}>
                                  {s.readyState || 'inactive'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">Nenhum sender ativo</span>
                        )}
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 space-y-1.5">
                        <div className="font-bold text-slate-300 flex items-center justify-between">
                          <span>Receivers (Faixas Recebidas):</span>
                          <span className="text-indigo-400 font-mono">{peer.receiversCount}</span>
                        </div>
                        {peer.receivers.length > 0 ? (
                          <div className="space-y-1">
                            {peer.receivers.map((r, rIdx) => (
                              <div
                                key={rIdx}
                                className="flex items-center justify-between font-mono text-[10px] bg-slate-950/50 px-2 py-1 rounded"
                              >
                                <span className="text-indigo-300 font-bold uppercase">{r.kind}</span>
                                <span className="text-slate-400 truncate max-w-[150px]">{r.id || 'sem track'}</span>
                                <span className={r.readyState === 'live' ? 'text-emerald-400' : 'text-slate-500'}>
                                  {r.readyState || 'inactive'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">Nenhum receiver ativo</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 space-y-1">
                <p>Nenhum nó remoto conectado no momento nesta sala de voz.</p>
                <p className="text-[11px] text-slate-600">
                  Abra uma segunda aba ou convide outro usuário para iniciar o handshake P2P WebRTC.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dica: Clique em "Imprimir no Console" para exportar as tabelas nativas de RTCPeerConnection.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
