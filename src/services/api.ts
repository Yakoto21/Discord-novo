import { Channel, Message, User } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  details?: string;
  issues?: string[];
  retryAfterMinutes?: number;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = data?.details;
    this.issues = data?.issues;
    this.retryAfterMinutes = data?.retryAfterMinutes;
  }
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('discord_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('discord_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('discord_token');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || `Erro HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  // Autenticação
  login: (email: string, password: string) =>
    request<{ success: boolean; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<{ success: boolean; user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<{ success: boolean; user: User }>('/auth/me'),

  updateProfile: (profileData: Partial<User>) =>
    request<{ success: boolean; user: User; token: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  getMembers: () => request<{ success: boolean; members: User[] }>('/auth/members'),

  // Canais e Mensagens
  getChannels: () => request<{ success: boolean; channels: Channel[] }>('/channels'),

  getMessages: (channelId: string) =>
    request<{ success: boolean; messages: Message[] }>(`/channels/${channelId}/messages`),

  sendMessage: (channelId: string, content: string, attachments?: any[]) =>
    request<{ success: boolean; message: Message }>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),

  editMessage: (channelId: string, messageId: string, content: string) =>
    request<{ success: boolean; message: Message }>(`/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  clearChannelMessages: (channelId: string) =>
    request<{ success: boolean; message: string; channelId: string }>(`/channels/${channelId}/messages`, {
      method: 'DELETE',
    }),

  getHealth: () => request<any>('/health'),
};
