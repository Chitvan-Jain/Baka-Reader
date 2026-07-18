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

// ─── Current user UID (set by AuthContext on login/logout) ─────────

let _currentUid: string | null = null;

export function setCurrentUser(uid: string | null): void {
  _currentUid = uid;
}

export function getCurrentUid(): string | null {
  return _currentUid;
}

// ─── localStorage helpers ──────────────────────────────────────────

function getItem<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// ─── Firestore sync (fire-and-forget for writes) ───────────────────

function syncField(field: keyof UserData, value: any): void {
  if (!_currentUid) return;
  firestore.setUserData(_currentUid, { [field]: value }).catch(() => {});
}

/**
 * Called once on login: pulls Firestore data, merges with localStorage,
 * writes merged result back to both.
 */
export async function mergeOnLogin(uid: string): Promise<void> {
  setCurrentUser(uid);

  const remote = await firestore.getUserData(uid);

  // Merge favorites (union by mangaId, keep latest)
  const localFavs = getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  const mergedFavs = mergeById(localFavs, remote.favorites, 'mangaId');
  setItem(KEYS.FAVORITES, mergedFavs);

  // Merge read-later
  const localRL = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  const mergedRL = mergeById(localRL, remote.readLater, 'mangaId');
  setItem(KEYS.READ_LATER, mergedRL);

  // Merge reading progress (latest timestamp wins per mangaId)
  const localProgress = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  const mergedProgress = { ...remote.readingProgress };
  for (const [id, prog] of Object.entries(localProgress)) {
    if (!mergedProgress[id] || prog.timestamp > mergedProgress[id].timestamp) {
      mergedProgress[id] = prog;
    }
  }
  setItem(KEYS.READING_PROGRESS, mergedProgress);

  // Merge reading history (union by mangaId, latest first, cap at 100)
  const localHistory = getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
  const mergedHistory = mergeById(localHistory, remote.readingHistory, 'mangaId')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);
  setItem(KEYS.READING_HISTORY, mergedHistory);

  // Merge read chapters (union)
  const localReadCh = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  const remoteReadChSet = new Set(remote.readChapters);
  for (const id of Object.keys(localReadCh)) {
    remoteReadChSet.add(id);
  }
  const mergedReadCh: Record<string, boolean> = {};
  for (const id of remoteReadChSet) {
    mergedReadCh[id] = true;
  }
  setItem(KEYS.READ_CHAPTERS, mergedReadCh);

  // Merge reading lists (union by id)
  const localLists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const mergedLists = mergeById(localLists, remote.readingLists, 'id');
  setItem(KEYS.READING_LISTS, mergedLists);

  // Reader settings: remote wins if exists
  if (remote.readerSettings) {
    setItem(KEYS.READER_SETTINGS, remote.readerSettings);
  }

  // Push merged data back to Firestore
  await firestore.setUserData(uid, {
    favorites: mergedFavs,
    readLater: mergedRL,
    readingProgress: mergedProgress,
    readingHistory: mergedHistory,
    readChapters: [...remoteReadChSet],
    readingLists: mergedLists,
    readerSettings: getItem<ReaderSettings>(KEYS.READER_SETTINGS, null as any),
  });
}

/** Merge two arrays by a key field. Local items with newer timestamps win. */
function mergeById<T extends Record<string, any>>(local: T[], remote: T[], key: string): T[] {
  const map = new Map<string, T>();
  for (const item of remote) {
    map.set(item[key], item);
  }
  for (const item of local) {
    const existing = map.get(item[key]);
    if (!existing) {
      map.set(item[key], item);
    } else if (item.timestamp && existing.timestamp && item.timestamp > existing.timestamp) {
      map.set(item[key], item);
    } else if (item.addedAt && existing.addedAt && item.addedAt > existing.addedAt) {
      map.set(item[key], item);
    }
  }
  return [...map.values()];
}

// ─── Reading Progress ──────────────────────────────────────────────

export function saveReadingProgress(progress: ReadingProgress): void {
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  all[progress.mangaId] = { ...progress, timestamp: Date.now() };
  setItem(KEYS.READING_PROGRESS, all);
  syncField('readingProgress', all);
}

export function getReadingProgress(mangaId: string): ReadingProgress | null {
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  return all[mangaId] || null;
}

export function getAllReadingProgress(): ReadingProgress[] {
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  return Object.values(all).sort((a, b) => b.timestamp - a.timestamp);
}

export function removeReadingProgress(mangaId: string): void {
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  delete all[mangaId];
  setItem(KEYS.READING_PROGRESS, all);
  syncField('readingProgress', all);
}

// ─── Read Later ────────────────────────────────────────────────────

export function addToReadLater(item: ReadLaterItem): void {
  const list = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  if (!list.find(i => i.mangaId === item.mangaId)) {
    list.unshift({ ...item, addedAt: Date.now() });
    setItem(KEYS.READ_LATER, list);
    syncField('readLater', list);
  }
}

export function removeFromReadLater(mangaId: string): void {
  const list = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  const updated = list.filter(i => i.mangaId !== mangaId);
  setItem(KEYS.READ_LATER, updated);
  syncField('readLater', updated);
}

export function getReadLaterList(): ReadLaterItem[] {
  return getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
}

export function isInReadLater(mangaId: string): boolean {
  return getReadLaterList().some(i => i.mangaId === mangaId);
}

// ─── Favorites ─────────────────────────────────────────────────────

export function addToFavorites(item: FavoriteItem): void {
  const list = getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  if (!list.find(i => i.mangaId === item.mangaId)) {
    list.unshift({ ...item, addedAt: Date.now() });
    setItem(KEYS.FAVORITES, list);
    syncField('favorites', list);
  }
}

export function removeFromFavorites(mangaId: string): void {
  const list = getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  const updated = list.filter(i => i.mangaId !== mangaId);
  setItem(KEYS.FAVORITES, updated);
  syncField('favorites', updated);
}

export function getFavoritesList(): FavoriteItem[] {
  return getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
}

export function isInFavorites(mangaId: string): boolean {
  return getFavoritesList().some(i => i.mangaId === mangaId);
}

// ─── Reading Lists ─────────────────────────────────────────────────

export function createReadingList(name: string, description = ''): ReadingList {
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
  return getItem<ReadingList[]>(KEYS.READING_LISTS, []);
}

export function updateReadingList(id: string, updates: Partial<ReadingList>): void {
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const index = lists.findIndex(l => l.id === id);
  if (index !== -1) {
    lists[index] = { ...lists[index], ...updates, updatedAt: Date.now() };
    setItem(KEYS.READING_LISTS, lists);
    syncField('readingLists', lists);
  }
}

export function deleteReadingList(id: string): void {
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const updated = lists.filter(l => l.id !== id);
  setItem(KEYS.READING_LISTS, updated);
  syncField('readingLists', updated);
}

export function addMangaToList(listId: string, mangaId: string): void {
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
  const history = getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
  const filtered = history.filter(h => h.mangaId !== entry.mangaId);
  filtered.unshift({ ...entry, timestamp: Date.now() });
  const capped = filtered.slice(0, 100);
  setItem(KEYS.READING_HISTORY, capped);
  syncField('readingHistory', capped);
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  return getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
}

export function clearReadingHistory(): void {
  setItem(KEYS.READING_HISTORY, []);
  syncField('readingHistory', []);
}

// ─── Read Chapters ─────────────────────────────────────────────────

export function markChapterRead(chapterId: string): void {
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  chapters[chapterId] = true;
  setItem(KEYS.READ_CHAPTERS, chapters);
  syncField('readChapters', Object.keys(chapters));
}

export function markChapterUnread(chapterId: string): void {
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  delete chapters[chapterId];
  setItem(KEYS.READ_CHAPTERS, chapters);
  syncField('readChapters', Object.keys(chapters));
}

export function isChapterRead(chapterId: string): boolean {
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  return !!chapters[chapterId];
}

export function getReadChapters(): string[] {
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
  return getItem<ReaderSettings>(KEYS.READER_SETTINGS, DEFAULT_READER_SETTINGS);
}

export function saveReaderSettings(settings: Partial<ReaderSettings>): void {
  const current = getReaderSettings();
  const merged = { ...current, ...settings };
  setItem(KEYS.READER_SETTINGS, merged);
  syncField('readerSettings', merged);
}

// ─── Recent Searches (local-only, no sync) ─────────────────────────

export function addRecentSearch(query: string): void {
  const searches = getItem<string[]>(KEYS.RECENT_SEARCHES, []);
  const filtered = searches.filter(s => s !== query);
  filtered.unshift(query);
  setItem(KEYS.RECENT_SEARCHES, filtered.slice(0, 10));
}

export function getRecentSearches(): string[] {
  return getItem<string[]>(KEYS.RECENT_SEARCHES, []);
}

export function clearRecentSearches(): void {
  setItem(KEYS.RECENT_SEARCHES, []);
}
