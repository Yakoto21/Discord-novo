import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Video,
  Upload,
  Smile,
  BadgePercent,
  Flame,
  Star,
  Check,
} from 'lucide-react';

export const NitroView: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(null);

  const handleSubscribe = (plan: string) => {
    setSubscribedPlan(plan);
    setTimeout(() => {
      setSubscribedPlan(null);
    }, 4000);
  };

  return (
    <div 
      id="nitro-view-root" 
      className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/10 text-[#dbdee1] overflow-y-auto scrollbar-thin select-none h-full min-h-0"
    >
      {/* Banner Hero do Discord Nitro */}
      <div className="relative bg-gradient-to-r from-[#5865f2] via-[#eb459e] to-[#f47b67] p-8 md:p-12 text-white overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#f0b232]" />
            <span>Desbloqueie todo o potencial do Discord</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Turbine sua experiência com o Discord Nitro
          </h1>

          <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl">
            Transmissões em HD 4K 60FPS no WebRTC, emojis e figurinhas personalizadas em qualquer servidor, uploads gigantes até 500MB, badges exclusivas de perfil e 2 impulsos de servidor.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleSubscribe('Nitro Completo')}
              className="bg-white text-[#1e1f22] hover:bg-[#dbdee1] font-bold text-sm px-6 py-3 rounded-full transition-transform active:scale-95 shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-[#5865f2]" />
              <span>Assinar Nitro por R$ 24,99/mês</span>
            </button>

            <button
              onClick={() => handleSubscribe('Nitro Básico')}
              className="bg-black/40 hover:bg-black/60 text-white font-semibold text-sm px-5 py-3 rounded-full transition-colors cursor-pointer border border-white/20"
            >
              Nitro Basic por R$ 8,99/mês
            </button>
          </div>
        </div>

        {/* Efeito decorativo de fundo */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {subscribedPlan && (
        <div className="mx-8 mt-6 bg-[#23a55a]/20 border border-[#23a55a] text-[#23a55a] p-4 rounded-xl flex items-center gap-3 font-semibold text-sm animate-in fade-in">
          <Check className="w-5 h-5 shrink-0" />
          <span>Parabéns! Benefícios do {subscribedPlan} foram ativados com sucesso na sua conta!</span>
        </div>
      )}

      {/* Planos e Vantagens */}
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Compare os Planos Nitro</h2>
          <p className="text-sm text-[#949ba4]">Escolha o plano ideal para suas conversas e transmissões</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Nitro Basic */}
          <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#35373c] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Nitro Basic</h3>
                <span className="text-xs bg-[#35373c] text-[#dbdee1] px-2.5 py-1 rounded-full font-bold">
                  BÁSICO
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                R$ 8,99 <span className="text-xs text-[#949ba4] font-normal">/ mês</span>
              </div>
              <div className="space-y-2.5 text-xs text-[#dbdee1]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  <span>Uploads de até 50MB</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  <span>Emojis personalizados em qualquer servidor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  <span>Badge Nitro no seu perfil</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  <span>Reações super com efeitos visuais</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe('Nitro Basic')}
              className="w-full bg-[#4e5058] hover:bg-[#5865f2] text-white font-bold text-xs py-3 rounded-lg transition-colors cursor-pointer"
            >
              Escolher Basic
            </button>
          </div>

          {/* Card: Nitro Completo */}
          <div className="bg-gradient-to-b from-[#2b2d31] to-[#313338] p-6 rounded-2xl border-2 border-[#5865f2] flex flex-col justify-between space-y-6 relative shadow-2xl">
            <div className="absolute -top-3 right-6 bg-[#5865f2] text-white text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
              MAIS POPULAR
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-[#5865f2]" />
                  <span>Nitro</span>
                </h3>
              </div>
              <div className="text-2xl font-black text-white">
                R$ 24,99 <span className="text-xs text-[#949ba4] font-normal">/ mês</span>
              </div>
              <div className="space-y-2.5 text-xs text-[#dbdee1]">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
                  <span>Uploads gigantes de até 500MB</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
                  <span>Transmissão WebRTC em 4K e 60 FPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
                  <span>2 Impulsos de Servidor grátis (+ 30% off nos adicionais)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
                  <span>Avatares animados, banners e temas coloridos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
                  <span>Mensagens longas de até 4.000 caracteres</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
                  <span>Entre em até 200 servidores simultâneos</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe('Nitro')}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs py-3 rounded-lg transition-colors cursor-pointer shadow-md"
            >
              Assinar Nitro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
