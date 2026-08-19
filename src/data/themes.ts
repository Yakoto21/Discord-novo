import { ServerTheme } from '../types';

export const PRESET_SERVER_THEMES: Record<string, ServerTheme> = {
  'cyber-cyan': {
    id: 'cyber-cyan',
    name: 'Cyberpunk Neon Cyan',
    primary: '#06b6d4',
    primaryGlow: 'rgba(6, 182, 212, 0.35)',
    accent: '#6366f1',
    bgGradient: 'from-cyan-950/40 via-slate-950/80 to-[#0b0e14]',
    sidebarBg: 'bg-[#0e121b]/95',
    cardBorder: 'border-cyan-500/25 hover:border-cyan-400/50',
    accentText: 'text-cyan-400',
    headerGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent'
  },
  'matrix-emerald': {
    id: 'matrix-emerald',
    name: 'Matrix Cyber Emerald',
    primary: '#10b981',
    primaryGlow: 'rgba(16, 185, 129, 0.35)',
    accent: '#059669',
    bgGradient: 'from-emerald-950/40 via-slate-950/80 to-[#09120e]',
    sidebarBg: 'bg-[#0a1510]/95',
    cardBorder: 'border-emerald-500/25 hover:border-emerald-400/50',
    accentText: 'text-emerald-400',
    headerGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  'synthwave-purple': {
    id: 'synthwave-purple',
    name: 'Synthwave & Neon Violet',
    primary: '#a855f7',
    primaryGlow: 'rgba(168, 85, 247, 0.35)',
    accent: '#ec4899',
    bgGradient: 'from-purple-950/40 via-slate-950/80 to-[#100a18]',
    sidebarBg: 'bg-[#120d1c]/95',
    cardBorder: 'border-purple-500/25 hover:border-purple-400/50',
    accentText: 'text-purple-400',
    headerGradient: 'from-purple-500/20 via-pink-500/10 to-transparent'
  },
  'solar-amber': {
    id: 'solar-amber',
    name: 'Solar Flare & Amber Gold',
    primary: '#f59e0b',
    primaryGlow: 'rgba(245, 158, 11, 0.35)',
    accent: '#ea580c',
    bgGradient: 'from-amber-950/40 via-slate-950/80 to-[#140f09]',
    sidebarBg: 'bg-[#171109]/95',
    cardBorder: 'border-amber-500/25 hover:border-amber-400/50',
    accentText: 'text-amber-400',
    headerGradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
  },
  'crimson-ruby': {
    id: 'crimson-ruby',
    name: 'Crimson Dragon & Ruby Red',
    primary: '#f43f5e',
    primaryGlow: 'rgba(244, 63, 94, 0.35)',
    accent: '#e11d48',
    bgGradient: 'from-rose-950/40 via-slate-950/80 to-[#140a0e]',
    sidebarBg: 'bg-[#180b10]/95',
    cardBorder: 'border-rose-500/25 hover:border-rose-400/50',
    accentText: 'text-rose-400',
    headerGradient: 'from-rose-500/20 via-red-500/10 to-transparent'
  },
  'galactic-cobalt': {
    id: 'galactic-cobalt',
    name: 'Galactic Deep Cobalt',
    primary: '#3b82f6',
    primaryGlow: 'rgba(59, 130, 246, 0.35)',
    accent: '#2563eb',
    bgGradient: 'from-blue-950/40 via-slate-950/80 to-[#080d1a]',
    sidebarBg: 'bg-[#091122]/95',
    cardBorder: 'border-blue-500/25 hover:border-blue-400/50',
    accentText: 'text-blue-400',
    headerGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent'
  }
};

export const DEFAULT_SERVER_THEME = PRESET_SERVER_THEMES['cyber-cyan'];
