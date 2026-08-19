import React, { useState, useEffect } from 'react';
import {
  X,
  Keyboard,
  Mic,
  Headphones,
  Compass,
  MessageSquare,
  Settings,
  Search,
  CheckCircle2,
  Sparkles,
  Zap,
  Radio,
} from 'lucide-react';
import { KeyboardShortcutDefinition, ShortcutCategory } from '../../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcutDefinition[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [matchedShortcut, setMatchedShortcut] = useState<KeyboardShortcutDefinition | null>(null);

  // Detector de teclas em tempo real para o simulador interativo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keys: string[] = [];
      if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');

      let mainKey = e.key.toUpperCase();
      if (e.key === 'ArrowDown') mainKey = '↓';
      if (e.key === 'ArrowUp') mainKey = '↑';
      if (e.key === 'Escape') mainKey = 'ESC';
      if (e.key === ' ') mainKey = 'Espaço';

      if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(mainKey)) {
        keys.push(mainKey);
      }

      setPressedKeys(keys);

      // Encontra atalho correspondente
      const found = shortcuts.find((s) => {
        const hasCtrl = Boolean(s.ctrlOrMeta) === (e.ctrlKey || e.metaKey);
        const hasShift = Boolean(s.shift) === e.shiftKey;
        const hasAlt = Boolean(s.alt) === e.altKey;
        const keyMatch =
          s.key === e.key.toLowerCase() ||
          (s.key === 'arrowdown' && e.key === 'ArrowDown') ||
          (s.key === 'arrowup' && e.key === 'ArrowUp') ||
          (s.key === 'escape' && e.key === 'Escape');

        return hasCtrl && hasShift && hasAlt && keyMatch;
      });

      setMatchedShortcut(found || null);
    };

    const handleKeyUp = () => {
      // Delay suave para a animação das teclas
      setTimeout(() => {
        setPressedKeys([]);
      }, 300);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, shortcuts]);

  if (!isOpen) return null;

  const categories: { id: ShortcutCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'Todos os Atalhos', icon: Keyboard },
    { id: 'voice', label: 'Voz & Áudio', icon: Mic },
    { id: 'navigation', label: 'Navegação & Canais', icon: Compass },
    { id: 'chat', label: 'Chat & Mensagens', icon: MessageSquare },
    { id: 'system', label: 'Sistema & Interface', icon: Settings },
  ];

  const filteredShortcuts = shortcuts.filter((sc) => {
    const matchesCategory = selectedCategory === 'all' || sc.category === selectedCategory;
    const matchesSearch =
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div
      id="keyboard-shortcuts-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="keyboard-shortcuts-modal-card"
        className="bg-[#313338] w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-[#3f4147] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-5 pb-4 border-b border-[#232428] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5865f2]/15 text-[#5865f2] border border-[#5865f2]/30 shadow-inner">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Gerenciador de Atalhos de Teclado</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30">
                  Global Ativo
                </span>
              </h2>
              <p className="text-xs text-[#949ba4] mt-0.5">
                Controle voz, canais, busca e interface sem tirar as mãos do teclado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1.5 rounded-lg hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulador Interativo de Teclas ("Pressione para Testar") */}
        <div className="bg-[#1e1f22] px-5 py-3.5 border-b border-[#232428] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#dbdee1]">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong>Detector em Tempo Real:</strong> Pressione qualquer combinação de teclas no seu teclado físico:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pressedKeys.length > 0 ? (
              <div className="flex items-center gap-1.5 animate-in zoom-in-90 duration-100">
                {pressedKeys.map((k, idx) => (
                  <kbd
                    key={idx}
                    className="bg-[#5865f2] text-white font-mono font-bold text-xs px-2.5 py-1 rounded-md shadow-md border border-white/20"
                  >
                    {k}
                  </kbd>
                ))}
                {matchedShortcut && (
                  <span className="text-xs font-semibold text-emerald-400 ml-2 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {matchedShortcut.title}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#949ba4] font-mono bg-[#2b2d31] px-3 py-1 rounded-md border border-[#3f4147]">
                Aguardando teclas...
              </span>
            )}
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="p-4 bg-[#2b2d31]/60 border-b border-[#232428] flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#5865f2] text-white shadow-sm'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]" />
            <input
              type="text"
              placeholder="Buscar atalho..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1f22] text-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#3f4147] focus:outline-hidden focus:border-[#5865f2] placeholder-[#949ba4]"
            />
          </div>
        </div>

        {/* Lista de Atalhos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 custom-scrollbar">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-[#949ba4] text-xs">
              Nenhum atalho encontrado para a busca atual.
            </div>
          ) : (
            filteredShortcuts.map((sc) => {
              return (
                <div
                  key={sc.id}
                  id={`shortcut-item-${sc.id}`}
                  className="bg-[#2b2d31] hover:bg-[#35373c] p-3.5 rounded-xl border border-[#3f4147] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs"
                >
                  <div className="space-y-0.5 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {sc.title}
                      </h4>
                      {sc.category === 'voice' && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Voz
                        </span>
                      )}
                      {sc.category === 'navigation' && (
                        <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          Canais
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#949ba4] leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  {/* Teclas Visuais (Keycaps) */}
                  <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                    {sc.keys.map((k, idx) => (
                      <kbd
                        key={idx}
                        className="bg-[#1e1f22] text-[#5865f2] group-hover:text-white group-hover:bg-[#5865f2] transition-colors font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-[#3f4147] shadow-inner"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-4 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-between text-xs text-[#949ba4]">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Os atalhos funcionam globalmente em toda a aplicação.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
