import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  Cpu,
  Radio,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealthData(data);
    } catch (e) {
      console.warn('Erro ao checar status de segurança:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="security-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div 
        id="security-modal-card"
        className="bg-[#313338] w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#3f4147] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabeçalho */}
        <div className="bg-[#2b2d31] p-5 border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865f2] flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Arquitetura de Segurança & Backend
                <span className="text-xs bg-[#23a55a]/20 text-[#23a55a] font-bold px-2 py-0.5 rounded border border-[#23a55a]/30">
                  ATIVO
                </span>
              </h2>
              <p className="text-xs text-[#949ba4]">
                Especificações técnicas de proteção contra ataques automatizados, hashing e WebRTC.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-full hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-[#1a1b1e]">
          {/* Status em Tempo Real da API */}
          <div className="bg-[#1e1f22] rounded-xl p-4 border border-[#2b2d31]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Server className="w-4 h-4 text-[#5865f2]" />
                <span>Status da API Express & Node.js</span>
              </div>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="text-xs text-[#5865f2] hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar Diagnóstico</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#2b2d31] p-2.5 rounded-lg border border-[#35373c]">
                <div className="text-[#949ba4] text-[11px]">Bcrypt Cost</div>
                <div className="text-white font-bold text-sm mt-0.5">
                  {healthData?.security?.bcryptSaltRounds || 12} Rounds
                </div>
              </div>

              <div className="bg-[#2b2d31] p-2.5 rounded-lg border border-[#35373c]">
                <div className="text-[#949ba4] text-[11px]">Rate Limiter</div>
                <div className="text-[#23a55a] font-bold text-sm mt-0.5">
                  10 req / 15 min
                </div>
              </div>

              <div className="bg-[#2b2d31] p-2.5 rounded-lg border border-[#35373c]">
                <div className="text-[#949ba4] text-[11px]">Autenticação</div>
                <div className="text-white font-bold text-sm mt-0.5">
                  JWT HMAC-SHA256
                </div>
              </div>

              <div className="bg-[#2b2d31] p-2.5 rounded-lg border border-[#35373c]">
                <div className="text-[#949ba4] text-[11px]">STUN Servers</div>
                <div className="text-[#5865f2] font-bold text-sm mt-0.5">
                  Google STUN (Mesh)
                </div>
              </div>
            </div>
          </div>

          {/* Cards explicativos das 4 camadas de segurança */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Hashing e Timing Attacks */}
            <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Lock className="w-4 h-4 text-[#f0b232]" />
                <span>1. Hashing & Timing Attacks</span>
              </div>
              <p className="text-xs text-[#dbdee1] leading-relaxed">
                Utiliza <strong>bcryptjs com salt rounds = 12</strong>. Para prevenir que invasores descubram se um e-mail existe no banco medindo o tempo de resposta (Timing Attack), executamos um <em>dummy hash comparison</em> quando o e-mail não é encontrado.
              </p>
              <div className="bg-[#1e1f22] p-2 rounded text-[11px] font-mono text-[#23a55a]">
                const hash = user ? user.hash : DUMMY_HASH;<br />
                await bcrypt.compare(pass, hash);
              </div>
            </div>

            {/* 2. Rate Limiting & Anti-Brute Force */}
            <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-[#f23f43]" />
                <span>2. Proteção Anti-Força Bruta</span>
              </div>
              <p className="text-xs text-[#dbdee1] leading-relaxed">
                Implementação de <strong>express-rate-limit</strong> isolado nas rotas <code>/api/auth/login</code> e <code>/register</code>. Bloqueia scripts de <em>credential stuffing</em> e ataques de dicionário após 10 tentativas.
              </p>
              <div className="bg-[#1e1f22] p-2 rounded text-[11px] font-mono text-[#5865f2]">
                HTTP 429 Too Many Requests<br />
                Retry-After: 900s (15 min)
              </div>
            </div>

            {/* 3. WebRTC Mesh & Sinalização */}
            <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Radio className="w-4 h-4 text-[#23a55a]" />
                <span>3. WebRTC Mesh & Socket.io</span>
              </div>
              <p className="text-xs text-[#dbdee1] leading-relaxed">
                O Socket.io atua como servidor de sinalização transmitindo <strong>SDP Offers</strong>, <strong>Answers</strong> e <strong>ICE Candidates</strong>. A mídia de voz/vídeo flui ponto-a-ponto (P2P criptografada com SRTP).
              </p>
              <div className="bg-[#1e1f22] p-2 rounded text-[11px] font-mono text-[#f0b232]">
                STUN NAT Traversal + VAD AudioContext
              </div>
            </div>

            {/* 4. Validação e Sanitização com Zod */}
            <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Zap className="w-4 h-4 text-[#5865f2]" />
                <span>4. Validação Estrita de Entrada</span>
              </div>
              <p className="text-xs text-[#dbdee1] leading-relaxed">
                Todos os dados enviados aos endpoints são validados em tempo de execução com schemas <strong>Zod</strong>, impedindo caracteres de controle maliciosos e injeções no payload.
              </p>
              <div className="bg-[#1e1f22] p-2 rounded text-[11px] font-mono text-[#dbdee1]">
                registerSchema.safeParse(req.body)
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="bg-[#2b2d31] p-4 border-t border-[#232428] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-5 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
