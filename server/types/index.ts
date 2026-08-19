export interface User {
  id: string;
  username: string;
  discriminator: string;
  email: string;
  avatarUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  bio?: string;
  bannerUrl?: string;
  bannerColor?: string;
  pronouns?: string;
  themeColor?: string;
  role: 'admin' | 'moderator' | 'member';
  createdAt: string;
}

export type FocusMode = 'work' | 'short_break' | 'long_break';

export interface FocusParticipant {
  socketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  currentTask?: string;
  isMuted: boolean;
  streak: number;
  joinedAt: string;
}

export interface FocusSessionState {
  channelId: string;
  mode: FocusMode;
  duration: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number | null;
  sessionRound: number;
  totalRounds: number;
  participants: FocusParticipant[];
  ambientSound?: string;
}

export interface Channel {
  id: string;
  serverId?: string;
  name: string;
  type: 'text' | 'voice' | 'dm' | 'focus';
  category: string;
  topic?: string;
  unreadCount?: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // userIds
}

export interface MessageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: 'image' | 'file';
}

export interface Message {
  id: string;
  channelId: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string;
    role: 'admin' | 'moderator' | 'member';
  };
  content: string;
  timestamp: string;
  edited?: boolean;
  isPinned?: boolean;
  parentMessageId?: string;
  threadCount?: number;
  threadLastReplyAt?: string;
  threadReplies?: Message[];
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface VoiceParticipant {
  socketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}

export interface VoiceRoom {
  channelId: string;
  name: string;
  participants: Map<string, VoiceParticipant>;
}
