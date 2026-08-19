/**
 * Utilitário de Notificações do Navegador (Web Notification API)
 * Dispara alertas nativos para mensagens privadas (DMs) e menções (@usuário)
 * quando a aplicação estiver minimizada, em segundo plano ou em outra aba.
 */

export interface BrowserNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
  isMention?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  notifyMentions: boolean;
  notifyDMs: boolean;
  notifyAllChannelMessages: boolean;
  onlyWhenBackground: boolean;
  playSound: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  notifyMentions: true,
  notifyDMs: true,
  notifyAllChannelMessages: false,
  onlyWhenBackground: true,
  playSound: true,
};

const STORAGE_KEY = 'quantum_notification_preferences';

export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = loadNotificationPreferences();
  const updated = { ...current, ...prefs };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar preferências de notificação:', e);
    }
  }
  return updated;
}

/**
 * Verifica se a API de Notificações é suportada no ambiente atual
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retorna o status de permissão atual ('granted' | 'denied' | 'default')
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Solicita permissão ao usuário para exibir notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Erro ao solicitar permissão de notificações:', e);
      return false;
    }
  }

  return false;
}

/**
 * Verifica se a janela do aplicativo está oculta ou sem foco
 */
export function isAppInBackground(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden || !document.hasFocus();
}

/**
 * Dispara uma notificação do navegador respeitando o status de foco e preferências
 */
export function notifyIfBackground(payload: BrowserNotificationPayload): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const prefs = loadNotificationPreferences();
  if (!prefs.enabled) {
    return null;
  }

  // Apenas notifica se a janela estiver minimizada, oculta ou sem foco (quando configurado)
  if (prefs.onlyWhenBackground && !isAppInBackground()) {
    return null;
  }

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.tag || `discord-quantum-${Date.now()}`,
      silent: false, // Permite o som nativo do sistema operacional
    });

    notification.onclick = () => {
      try {
        window.focus();
        if (payload.onClick) {
          payload.onClick();
        }
        notification.close();
      } catch (err) {
        console.warn('Erro ao focar janela via notificação:', err);
      }
    };

    return notification;
  } catch (err) {
    console.warn('Falha ao instanciar notificação nativa:', err);
    return null;
  }
}

/**
 * Dispara notificação de teste diretamente
 */
export function sendTestNotification(): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification('🔔 Quantum Core • Teste de Notificação', {
      body: 'As notificações do navegador estão configuradas e prontas para alertar menções e mensagens diretas!',
      icon: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      tag: 'test-notification',
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return notif;
  } catch (e) {
    console.warn('Erro ao disparar teste de notificação:', e);
    return null;
  }
}
