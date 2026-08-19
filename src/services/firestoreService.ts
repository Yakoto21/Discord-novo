import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Message, Channel, ServerGuild, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Ensure auth & test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth).catch(() => {});
    }
    await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
    return false;
  }
}

// ================= USER OPERATIONS =================
export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// ================= MESSAGE OPERATIONS =================
export async function saveMessage(message: Message): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    await setDoc(doc(db, 'messages', message.id), message, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveThreadReply(channelId: string, parentMessageId: string, reply: Message): Promise<void> {
  const path = `messages/${parentMessageId}`;
  try {
    const parentRef = doc(db, 'messages', parentMessageId);
    const parentSnap = await getDoc(parentRef);
    if (parentSnap.exists()) {
      const data = parentSnap.data() as Message;
      const currentReplies = data.threadReplies || [];
      const updatedReplies = [...currentReplies, reply];
      await updateDoc(parentRef, {
        threadReplies: updatedReplies,
        threadCount: updatedReplies.length,
        threadLastReplyAt: reply.timestamp,
      });
    } else {
      // Se não existir, salva a mensagem com a resposta inicial
      await setDoc(parentRef, {
        id: parentMessageId,
        channelId,
        threadReplies: [reply],
        threadCount: 1,
        threadLastReplyAt: reply.timestamp,
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getChannelMessages(channelId: string): Promise<Message[]> {
  const path = 'messages';
  try {
    const q = query(collection(db, 'messages'), where('channelId', '==', channelId), limit(100));
    const snapshot = await getDocs(q);
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push(doc.data() as Message);
    });
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToChannelMessages(channelId: string, onUpdate: (messages: Message[]) => void): Unsubscribe {
  const path = 'messages';
  const q = query(collection(db, 'messages'), where('channelId', '==', channelId), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((d) => msgs.push(d.data() as Message));
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      onUpdate(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ================= SERVER OPERATIONS =================
export async function saveServer(server: ServerGuild): Promise<void> {
  const path = `servers/${server.id}`;
  try {
    await setDoc(doc(db, 'servers', server.id), server, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getServers(): Promise<ServerGuild[]> {
  const path = 'servers';
  try {
    const snap = await getDocs(collection(db, 'servers'));
    const list: ServerGuild[] = [];
    snap.forEach((d) => list.push(d.data() as ServerGuild));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteServerDoc(serverId: string): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    await deleteDoc(doc(db, 'servers', serverId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ================= CHANNEL OPERATIONS =================
export async function saveChannel(channel: Channel): Promise<void> {
  const path = `channels/${channel.id}`;
  try {
    await setDoc(doc(db, 'channels', channel.id), channel, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteChannelDoc(channelId: string): Promise<void> {
  const path = `channels/${channelId}`;
  try {
    await deleteDoc(doc(db, 'channels', channelId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
