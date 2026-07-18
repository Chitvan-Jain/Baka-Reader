import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  ReadingProgress,
  ReadLaterItem,
  FavoriteItem,
  ReadingList,
  ReadingHistoryEntry,
  ReaderSettings,
} from '../types';

/**
 * Shape of the single Firestore document stored per user at:
 *   users/{uid}/userData/data
 */
export interface UserData {
  favorites: FavoriteItem[];
  readLater: ReadLaterItem[];
  readingProgress: Record<string, ReadingProgress>;
  readingHistory: ReadingHistoryEntry[];
  readChapters: string[];
  readingLists: ReadingList[];
  readerSettings: ReaderSettings | null;
}

const EMPTY_USER_DATA: UserData = {
  favorites: [],
  readLater: [],
  readingProgress: {},
  readingHistory: [],
  readChapters: [],
  readingLists: [],
  readerSettings: null,
};

function userDataRef(uid: string) {
  return doc(db, 'users', uid);
}

// ─── Read ──────────────────────────────────────────────────────────

export async function getUserData(uid: string): Promise<UserData> {
  try {
    const snap = await getDoc(userDataRef(uid));
    if (snap.exists()) {
      return { ...EMPTY_USER_DATA, ...snap.data() } as UserData;
    }
    return { ...EMPTY_USER_DATA };
  } catch (err) {
    console.error('[Firestore] Failed to get user data:', err);
    return { ...EMPTY_USER_DATA };
  }
}

// ─── Write (full doc, merge mode) ──────────────────────────────────

export async function setUserData(uid: string, data: Partial<UserData>): Promise<void> {
  try {
    await setDoc(userDataRef(uid), data, { merge: true });
  } catch (err) {
    console.error('[Firestore] Failed to set user data:', err);
  }
}

// ─── Granular field updates ────────────────────────────────────────

export async function updateFavorites(uid: string, favorites: FavoriteItem[]): Promise<void> {
  return setUserData(uid, { favorites });
}

export async function updateReadLater(uid: string, readLater: ReadLaterItem[]): Promise<void> {
  return setUserData(uid, { readLater });
}

export async function updateReadingProgress(uid: string, progress: Record<string, ReadingProgress>): Promise<void> {
  return setUserData(uid, { readingProgress: progress });
}

export async function updateReadingHistory(uid: string, history: ReadingHistoryEntry[]): Promise<void> {
  return setUserData(uid, { readingHistory: history });
}

export async function updateReadChapters(uid: string, chapters: string[]): Promise<void> {
  return setUserData(uid, { readChapters: chapters });
}

export async function updateReadingLists(uid: string, lists: ReadingList[]): Promise<void> {
  return setUserData(uid, { readingLists: lists });
}

export async function updateReaderSettings(uid: string, settings: ReaderSettings): Promise<void> {
  return setUserData(uid, { readerSettings: settings });
}
