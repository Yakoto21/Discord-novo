import { useState, useEffect, useCallback, useMemo } from 'react';
import { KeyboardShortcutDefinition, TriggeredShortcutToast } from '../types';

interface UseKeyboardShortcutsProps {
  onToggleMute?: () => void;
  onToggleDeafen?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onNextServer?: () => void;
  onPrevServer?: () => void;
  onOpenQuickSwitcher?: () => void;
  onFocusChatSearch?: () => void;
  onOpenUserSettings?: () => void;
  onToggleMemberList?: () => void;
  onCloseModals?: () => void;
  isMuted?: boolean;
  isDeafened?: boolean;
}

export function useKeyboardShortcuts({
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onNextChannel,
  onPrevChannel,
  onNextServer,
  onPrevServer,
  onOpenQuickSwitcher,
  onFocusChatSearch,
  onOpenUserSettings,
  onToggleMemberList,
  onCloseModals,
  isMuted = false,
  isDeafened = false,
}: UseKeyboardShortcutsProps) {
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<TriggeredShortcutToast | null>(null);

  const showToast = useCallback((toast: TriggeredShortcutToast) => {
    setActiveToast(toast);
  }, []);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const shortcuts: KeyboardShortcutDefinition[] = useMemo(
    () => [
      // 1. Voz & Comunicação
      {
        id: 'toggle-mute',
        title: 'Alternar Mudo do Microfone',
        description: 'Muta ou desmuta instantaneamente o microfone na sala de voz atual.',
        category: 'voice',
        keys: ['Ctrl', 'Shift', 'M'],
        ctrlOrMeta: true,
        shift: true,
        key: 'm',
        action: () => {
          if (onToggleMute) {
            onToggleMute();
            showToast({
              id: 'toast-mute',
              title: !isMuted ? 'Microfone Mutado' : 'Microfone Ativado',
              description: !isMuted ? 'Seu microfone foi desativado.' : 'Seu microfone está transmitindo.',
              keys: ['Ctrl', 'Shift', 'M'],
              iconType: 'mic',
            });
          }
        },
      },
      {
        id: 'toggle-deafen',
        title: 'Alternar Ensurdecer (Deafen)',
        description: 'Desativa todo o áudio de entrada da chamada e muta o microfone.',
        category: 'voice',
        keys: ['Ctrl', 'Shift', 'D'],
        ctrlOrMeta: true,
        shift: true,
        key: 'd',
        action: () => {
          if (onToggleDeafen) {
            onToggleDeafen();
            showToast({
              id: 'toast-deafen',
              title: !isDeafened ? 'Áudio Ensurdecido' : 'Áudio Restaurado',
              description: !isDeafened ? 'Você não ouvirá os outros participantes.' : 'Você voltou a ouvir a chamada.',
              keys: ['Ctrl', 'Shift', 'D'],
              iconType: 'headphones',
            });
          }
        },
      },
      {
        id: 'toggle-video',
        title: 'Alternar Câmera de Vídeo',
        description: 'Liga ou desliga o feed da sua webcam na chamada de voz.',
        category: 'voice',
        keys: ['Ctrl', 'Shift', 'V'],
        ctrlOrMeta: true,
        shift: true,
        key: 'v',
        action: () => {
          if (onToggleVideo) {
            onToggleVideo();
            showToast({
              id: 'toast-video',
              title: 'Câmera Alternada',
              description: 'Estado da transmissão de vídeo atualizado.',
              keys: ['Ctrl', 'Shift', 'V'],
              iconType: 'info',
            });
          }
        },
      },
      {
        id: 'toggle-screenshare',
        title: 'Alternar Compartilhamento de Tela',
        description: 'Inicia ou encerra a captura de tela na sala WebRTC.',
        category: 'voice',
        keys: ['Ctrl', 'Shift', 'S'],
        ctrlOrMeta: true,
        shift: true,
        key: 's',
        action: () => {
          if (onToggleScreenShare) {
            onToggleScreenShare();
            showToast({
              id: 'toast-screen',
              title: 'Transmissão de Tela Alternada',
              description: 'Captura de tela atualizada.',
              keys: ['Ctrl', 'Shift', 'S'],
              iconType: 'info',
            });
          }
        },
      },

      // 2. Navegação & Canais
      {
        id: 'next-channel',
        title: 'Próximo Canal',
        description: 'Navega para o próximo canal de texto ou voz do servidor ativo.',
        category: 'navigation',
        keys: ['Alt', '↓'],
        alt: true,
        key: 'arrowdown',
        action: () => {
          if (onNextChannel) {
            onNextChannel();
            showToast({
              id: 'toast-next-channel',
              title: 'Próximo Canal',
              description: 'Navegando pelos canais do servidor.',
              keys: ['Alt', '↓'],
              iconType: 'channel',
            });
          }
        },
      },
      {
        id: 'prev-channel',
        title: 'Canal Anterior',
        description: 'Navega para o canal anterior do servidor ativo.',
        category: 'navigation',
        keys: ['Alt', '↑'],
        alt: true,
        key: 'arrowup',
        action: () => {
          if (onPrevChannel) {
            onPrevChannel();
            showToast({
              id: 'toast-prev-channel',
              title: 'Canal Anterior',
              description: 'Navegando pelos canais do servidor.',
              keys: ['Alt', '↑'],
              iconType: 'channel',
            });
          }
        },
      },
      {
        id: 'next-server',
        title: 'Próximo Servidor',
        description: 'Alterna para o próximo servidor na barra lateral.',
        category: 'navigation',
        keys: ['Ctrl', 'Alt', '↓'],
        ctrlOrMeta: true,
        alt: true,
        key: 'arrowdown',
        action: () => {
          if (onNextServer) {
            onNextServer();
            showToast({
              id: 'toast-next-server',
              title: 'Próximo Servidor',
              description: 'Servidor alternado.',
              keys: ['Ctrl', 'Alt', '↓'],
              iconType: 'channel',
            });
          }
        },
      },
      {
        id: 'prev-server',
        title: 'Servidor Anterior',
        description: 'Alterna para o servidor anterior na barra lateral.',
        category: 'navigation',
        keys: ['Ctrl', 'Alt', '↑'],
        ctrlOrMeta: true,
        alt: true,
        key: 'arrowup',
        action: () => {
          if (onPrevServer) {
            onPrevServer();
            showToast({
              id: 'toast-prev-server',
              title: 'Servidor Anterior',
              description: 'Servidor alternado.',
              keys: ['Ctrl', 'Alt', '↑'],
              iconType: 'channel',
            });
          }
        },
      },

      // 3. Chat & Mensagens
      {
        id: 'quick-switcher',
        title: 'Navegação Rápida / Quick Switcher',
        description: 'Abre a busca global para encontrar canais, DMs e servidores rapidamente.',
        category: 'chat',
        keys: ['Ctrl', 'K'],
        ctrlOrMeta: true,
        key: 'k',
        allowInInput: true,
        action: () => {
          if (onOpenQuickSwitcher) onOpenQuickSwitcher();
        },
      },
      {
        id: 'search-chat',
        title: 'Buscar Mensagens no Canal',
        description: 'Foca no campo de busca de histórico de mensagens do canal.',
        category: 'chat',
        keys: ['Ctrl', 'F'],
        ctrlOrMeta: true,
        key: 'f',
        allowInInput: true,
        action: () => {
          if (onFocusChatSearch) onFocusChatSearch();
        },
      },

      // 4. Sistema & Interface
      {
        id: 'open-shortcuts-modal',
        title: 'Central de Atalhos de Teclado',
        description: 'Abre o painel completo de atalhos e gerenciador de teclas.',
        category: 'system',
        keys: ['Ctrl', '/'],
        ctrlOrMeta: true,
        key: '/',
        allowInInput: true,
        action: () => {
          setIsShortcutsModalOpen((prev) => !prev);
        },
      },
      {
        id: 'toggle-user-settings',
        title: 'Configurações de Usuário',
        description: 'Abre as preferências de conta, perfil, áudio e vídeo.',
        category: 'system',
        keys: ['Ctrl', ','],
        ctrlOrMeta: true,
        key: ',',
        action: () => {
          if (onOpenUserSettings) onOpenUserSettings();
        },
      },
      {
        id: 'toggle-member-list',
        title: 'Ocultar / Exibir Lista de Membros',
        description: 'Alterna a visualização da barra lateral de participantes do servidor.',
        category: 'system',
        keys: ['Ctrl', 'U'],
        ctrlOrMeta: true,
        key: 'u',
        action: () => {
          if (onToggleMemberList) onToggleMemberList();
        },
      },
      {
        id: 'close-modals',
        title: 'Fechar Janelas e Desfocar (ESC)',
        description: 'Fecha o modal ativo ou desmarca foco do chat.',
        category: 'system',
        keys: ['ESC'],
        key: 'escape',
        allowInInput: true,
        action: () => {
          setIsShortcutsModalOpen(false);
          if (onCloseModals) onCloseModals();
        },
      },
    ],
    [
      onToggleMute,
      onToggleDeafen,
      onToggleVideo,
      onToggleScreenShare,
      onNextChannel,
      onPrevChannel,
      onNextServer,
      onPrevServer,
      onOpenQuickSwitcher,
      onFocusChatSearch,
      onOpenUserSettings,
      onToggleMemberList,
      onCloseModals,
      isMuted,
      isDeafened,
      showToast,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox');

      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const pressedKey = e.key.toLowerCase();

      // Atalho rápido adicional de ajuda: Shift + ?
      if (e.key === '?' && !isInput && !ctrlOrMeta && !alt) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      for (const sc of shortcuts) {
        const matchesCtrl = Boolean(sc.ctrlOrMeta) === Boolean(ctrlOrMeta);
        const matchesShift = Boolean(sc.shift) === Boolean(shift);
        const matchesAlt = Boolean(sc.alt) === Boolean(alt);
        const matchesKey =
          sc.key === pressedKey ||
          (sc.key === 'arrowdown' && pressedKey === 'arrowdown') ||
          (sc.key === 'arrowup' && pressedKey === 'arrowup') ||
          (sc.key === 'escape' && pressedKey === 'escape') ||
          (sc.key === '/' && (pressedKey === '/' || pressedKey === ';'));

        if (matchesCtrl && matchesShift && matchesAlt && matchesKey) {
          // Se estiver em um campo de texto e o atalho não for explicitamente permitido nele, ignora
          if (isInput && !sc.allowInInput) {
            continue;
          }

          e.preventDefault();
          if (sc.action) {
            sc.action();
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return {
    shortcuts,
    activeToast,
    dismissToast: () => setActiveToast(null),
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    openShortcutsModal: () => setIsShortcutsModalOpen(true),
    closeShortcutsModal: () => setIsShortcutsModalOpen(false),
  };
}
