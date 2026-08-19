export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';
export type UserRole = 'admin' | 'moderator' | 'member';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  avatarUrl: string;
  status: UserStatus;
  customStatus?: string;
  bio?: string;
  bannerUrl?: string;
  bannerColor?: string;
  pronouns?: string;
  themeColor?: string;
  role: UserRole;
  createdAt?: string;
  activity?: {
    type: 'playing' | 'listening' | 'streaming' | 'coding';
    name: string;
    details?: string;
  };
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
  duration: number; // total duration in seconds (e.g. 1500 for 25m)
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number | null;
  sessionRound: number;
  totalRounds: number;
  participants: FocusParticipant[];
  ambientSound?: string; // 'rain' | 'binaural' | 'lofi' | 'waves' | 'none'
}

export interface Channel {
  id: string;
  serverId?: string;
  name: string;
  type: 'text' | 'voice' | 'dm' | 'focus';
  category?: string;
  topic?: string;
  unreadCount?: number;
  recipient?: User; // Para DMs
  position?: number;
  focusState?: FocusSessionState;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: 'image' | 'file';
}

export interface MessageReply {
  id: string;
  authorName: string;
  content: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string;
    role: UserRole;
  };
  content: string;
  timestamp: string;
  edited?: boolean;
  isPinned?: boolean;
  replyTo?: MessageReply;
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
  stream?: MediaStream;
}

export interface ServerTheme {
  id: string;
  name: string;
  description?: string;
  primary?: string; // e.g. '#06b6d4' (hex)
  primaryColor?: string; // e.g. '#06b6d4' (hex)
  primaryGlow?: string; // rgba
  accent?: string; // e.g. '#8b5cf6'
  accentColor?: string; // e.g. '#8b5cf6'
  appBg?: string;
  chatBg?: string;
  bgGradient?: string; // e.g. 'from-cyan-950/40 via-slate-950 to-slate-950'
  sidebarBg?: string; // e.g. 'bg-slate-950/90'
  cardBorder?: string; // e.g. 'border-cyan-500/30'
  accentText?: string; // e.g. 'text-cyan-400'
  headerGradient?: string; // e.g. 'from-cyan-500/20 via-blue-500/10 to-transparent'
}

export interface ServerGuild {
  id: string;
  name: string;
  iconUrl?: string;
  bannerUrl?: string;
  description?: string;
  acronym: string;
  unread?: boolean;
  mentionCount?: number;
  memberCount?: number;
  isPublic?: boolean;
  category?: string;
  channels?: Channel[];
  theme?: ServerTheme;
}

export interface Friend {
  id: string;
  relationship: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'blocked';
  since: string;
  user: User;
}

export interface PeerDiagnosticInfo {
  socketId: string;
  signalingState: RTCSignalingState;
  iceConnectionState: RTCIceConnectionState;
  connectionState: RTCPeerConnectionState;
  iceGatheringState: RTCIceGatheringState;
  sendersCount: number;
  senders: Array<{
    kind: string;
    id?: string;
    enabled?: boolean;
    readyState?: string;
  }>;
  receiversCount: number;
  receivers: Array<{
    kind: string;
    id?: string;
    enabled?: boolean;
    readyState?: string;
  }>;
}

export interface WebRTCDiagnosticReport {
  timestamp: string;
  activeVoiceChannelId: string | null;
  peerCount: number;
  peers: PeerDiagnosticInfo[];
  local: {
    hasStream: boolean;
    audioTracks: number;
    videoTracks: number;
    tracks: Array<{ kind: string; id: string; enabled: boolean; readyState: string }>;
  };
  screenShare: {
    isScreenSharing: boolean;
    hasScreenStream: boolean;
    tracksCount: number;
    tracks: Array<{ kind: string; id: string; enabled: boolean; readyState: string }>;
  };
  state: {
    isMuted: boolean;
    isDeafened: boolean;
    isVideoOn: boolean;
    isSpeakingLocally: boolean;
    participantsCount: number;
  };
}

export type ShortcutCategory = 'voice' | 'navigation' | 'chat' | 'system';

export interface KeyboardShortcutDefinition {
  id: string;
  title: string;
  description: string;
  category: ShortcutCategory;
  keys: string[];
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  key: string;
  allowInInput?: boolean;
  action?: () => void;
}

export interface TriggeredShortcutToast {
  id: string;
  title: string;
  description?: string;
  keys: string[];
  iconType?: 'mic' | 'headphones' | 'channel' | 'search' | 'info' | 'settings';
}


