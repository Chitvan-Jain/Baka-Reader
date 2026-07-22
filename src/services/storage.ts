import type {
  ReadingProgress,
  ReadLaterItem,
  FavoriteItem,
  ReadingList,
  ReadingHistoryEntry,
  ReaderSettings,
} from '../types';
import * as firestore from './firestore';
import type { UserData } from './firestore';

const KEYS = {
  READING_PROGRESS: 'baka_reading_progress',
  READ_LATER: 'baka_read_later',
  FAVORITES: 'baka_favorites',
  READING_LISTS: 'baka_reading_lists',
  READING_HISTORY: 'baka_reading_history',
  READ_CHAPTERS: 'baka_read_chapters',
  READER_SETTINGS: 'baka_reader_settings',
  RECENT_SEARCHES: 'baka_recent_searches',
} as const;

// ─── Current user UID (set on login/logout) ────────────────────────

let _currentUid: string | null = null;

export function setCurrentUser(uid: string | null): void {
  _currentUid = uid;
}

export function getCurrentUid(): string | null {
  return _currentUid;
}

/** Returns true if a user is logged in */
function isLoggedIn(): boolean {
  return !!_currentUid;
}

// ─── localStorage helpers (used as a fast cache for logged-in users) ─

function getItem<T>(key: string, fallback: T): T {
  if (!isLoggedIn()) return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isLoggedIn()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// ─── Firestore sync (fire-and-forget writes) ───────────────────────

function syncField(field: keyof UserData, value: any): void {
  if (!_currentUid) return;
  firestore.setUserData(_currentUid, { [field]: value }).catch(() => {});
}

// ─── Login / Logout ────────────────────────────────────────────────

/**
 * Called once on login: pulls Firestore data into localStorage cache.
 */
export async function pullOnLogin(uid: string): Promise<void> {
  setCurrentUser(uid);

  const remote = await firestore.getUserData(uid);

  // Populate localStorage cache from Firestore
  setItem(KEYS.FAVORITES, remote.favorites);
  setItem(KEYS.READ_LATER, remote.readLater);
  setItem(KEYS.READING_PROGRESS, remote.readingProgress);
  setItem(KEYS.READING_HISTORY, remote.readingHistory);

  // Convert readChapters array to record for fast lookups
  const readChMap: Record<string, boolean> = {};
  for (const id of remote.readChapters) {
    readChMap[id] = true;
  }
  setItem(KEYS.READ_CHAPTERS, readChMap);
  setItem(KEYS.READING_LISTS, remote.readingLists);

  if (remote.readerSettings) {
    setItem(KEYS.READER_SETTINGS, remote.readerSettings);
  }
}

/**
 * Called on logout: clears all user data from localStorage.
 */
export function clearOnLogout(): void {
  _currentUid = null;
  for (const key of Object.values(KEYS)) {
    // Keep recent searches (not user data)
    if (key === KEYS.RECENT_SEARCHES) continue;
    localStorage.removeItem(key);
  }
}

// ─── Reading Progress ──────────────────────────────────────────────

export function saveReadingProgress(progress: ReadingProgress): void {
  if (!isLoggedIn()) return;
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  all[progress.mangaId] = { ...progress, timestamp: Date.now() };
  setItem(KEYS.READING_PROGRESS, all);
  syncField('readingProgress', all);
}

export function getReadingProgress(mangaId: string): ReadingProgress | null {
  if (!isLoggedIn()) return null;
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  return all[mangaId] || null;
}

export function getAllReadingProgress(): ReadingProgress[] {
  if (!isLoggedIn()) return [];
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  return Object.values(all).sort((a, b) => b.timestamp - a.timestamp);
}

export function removeReadingProgress(mangaId: string): void {
  if (!isLoggedIn()) return;
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  delete all[mangaId];
  setItem(KEYS.READING_PROGRESS, all);
  syncField('readingProgress', all);
}

// ─── Read Later ────────────────────────────────────────────────────

export function addToReadLater(item: ReadLaterItem): void {
  if (!isLoggedIn()) return;
  const list = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  if (!list.find(i => i.mangaId === item.mangaId)) {
    list.unshift({ ...item, addedAt: Date.now() });
    setItem(KEYS.READ_LATER, list);
    syncField('readLater', list);
  }
}

export function removeFromReadLater(mangaId: string): void {
  if (!isLoggedIn()) return;
  const list = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  const updated = list.filter(i => i.mangaId !== mangaId);
  setItem(KEYS.READ_LATER, updated);
  syncField('readLater', updated);
}

export function getReadLaterList(): ReadLaterItem[] {
  if (!isLoggedIn()) return [];
  return getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
}

export function isInReadLater(mangaId: string): boolean {
  if (!isLoggedIn()) return false;
  return getReadLaterList().some(i => i.mangaId === mangaId);
}

// ─── Favorites ─────────────────────────────────────────────────────

export function addToFavorites(item: FavoriteItem): void {
  if (!isLoggedIn()) return;
  const list = getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  if (!list.find(i => i.mangaId === item.mangaId)) {
    list.unshift({ ...item, addedAt: Date.now() });
    setItem(KEYS.FAVORITES, list);
    syncField('favorites', list);
  }
}

export function removeFromFavorites(mangaId: string): void {
  if (!isLoggedIn()) return;
  const list = getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  const updated = list.filter(i => i.mangaId !== mangaId);
  setItem(KEYS.FAVORITES, updated);
  syncField('favorites', updated);
}

export function getFavoritesList(): FavoriteItem[] {
  if (!isLoggedIn()) return [];
  return getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
}

export function isInFavorites(mangaId: string): boolean {
  if (!isLoggedIn()) return false;
  return getFavoritesList().some(i => i.mangaId === mangaId);
}

// ─── Reading Lists ─────────────────────────────────────────────────

export function createReadingList(name: string, description = ''): ReadingList | null {
  if (!isLoggedIn()) return null;
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const newList: ReadingList = {
    id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    mangaIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  lists.push(newList);
  setItem(KEYS.READING_LISTS, lists);
  syncField('readingLists', lists);
  return newList;
}

export function getReadingLists(): ReadingList[] {
  if (!isLoggedIn()) return [];
  return getItem<ReadingList[]>(KEYS.READING_LISTS, []);
}

export function updateReadingList(id: string, updates: Partial<ReadingList>): void {
  if (!isLoggedIn()) return;
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const index = lists.findIndex(l => l.id === id);
  if (index !== -1) {
    lists[index] = { ...lists[index], ...updates, updatedAt: Date.now() };
    setItem(KEYS.READING_LISTS, lists);
    syncField('readingLists', lists);
  }
}

export function deleteReadingList(id: string): void {
  if (!isLoggedIn()) return;
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const updated = lists.filter(l => l.id !== id);
  setItem(KEYS.READING_LISTS, updated);
  syncField('readingLists', updated);
}

export function addMangaToList(listId: string, mangaId: string): void {
  if (!isLoggedIn()) return;
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const list = lists.find(l => l.id === listId);
  if (list && !list.mangaIds.includes(mangaId)) {
    list.mangaIds.push(mangaId);
    list.updatedAt = Date.now();
    setItem(KEYS.READING_LISTS, lists);
    syncField('readingLists', lists);
  }
}

export function removeMangaFromList(listId: string, mangaId: string): void {
  if (!isLoggedIn()) return;
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const list = lists.find(l => l.id === listId);
  if (list) {
    list.mangaIds = list.mangaIds.filter(id => id !== mangaId);
    list.updatedAt = Date.now();
    setItem(KEYS.READING_LISTS, lists);
    syncField('readingLists', lists);
  }
}

// ─── Reading History ───────────────────────────────────────────────

export function addToHistory(entry: ReadingHistoryEntry): void {
  if (!isLoggedIn()) return;
  const history = getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
  const filtered = history.filter(h => h.mangaId !== entry.mangaId);
  filtered.unshift({ ...entry, timestamp: Date.now() });
  const capped = filtered.slice(0, 100);
  setItem(KEYS.READING_HISTORY, capped);
  syncField('readingHistory', capped);
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  if (!isLoggedIn()) return [];
  return getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
}

export function clearReadingHistory(): void {
  if (!isLoggedIn()) return;
  setItem(KEYS.READING_HISTORY, []);
  syncField('readingHistory', []);
}

// ─── Read Chapters ─────────────────────────────────────────────────

export function markChapterRead(chapterId: string): void {
  if (!isLoggedIn()) return;
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  chapters[chapterId] = true;
  setItem(KEYS.READ_CHAPTERS, chapters);
  syncField('readChapters', Object.keys(chapters));
}

export function markChapterUnread(chapterId: string): void {
  if (!isLoggedIn()) return;
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  delete chapters[chapterId];
  setItem(KEYS.READ_CHAPTERS, chapters);
  syncField('readChapters', Object.keys(chapters));
}

export function isChapterRead(chapterId: string): boolean {
  if (!isLoggedIn()) return false;
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  return !!chapters[chapterId];
}

export function getReadChapters(): string[] {
  if (!isLoggedIn()) return [];
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  return Object.keys(chapters);
}

// ─── Reader Settings ───────────────────────────────────────────────

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  mode: 'vertical',
  fitToWidth: true,
  brightness: 100,
  zoom: 100,
};

export function getReaderSettings(): ReaderSettings {
  // Reader settings work even without login (local defaults)
  return getItem<ReaderSettings>(KEYS.READER_SETTINGS, DEFAULT_READER_SETTINGS);
}

export function saveReaderSettings(settings: Partial<ReaderSettings>): void {
  const current = getReaderSettings();
  const merged = { ...current, ...settings };
  setItem(KEYS.READER_SETTINGS, merged);
  syncField('readerSettings', merged);
}

// ─── Recent Searches (always local, no auth required) ──────────────

export function addRecentSearch(query: string): void {
  try {
    const raw = localStorage.getItem(KEYS.RECENT_SEARCHES);
    const searches: string[] = raw ? JSON.parse(raw) : [];
    const filtered = searches.filter(s => s !== query);
    filtered.unshift(query);
    localStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(filtered.slice(0, 10)));
  } catch {}
}

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.RECENT_SEARCHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentSearches(): void {
  localStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify([]));
}
