import type {
  ReadingProgress,
  ReadLaterItem,
  FavoriteItem,
  ReadingList,
  ReadingHistoryEntry,
  ReaderSettings,
} from '../types';

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

// ─── Reading Progress ──────────────────────────────────────────────

export function saveReadingProgress(progress: ReadingProgress): void {
  const all = getItem<Record<string, ReadingProgress>>(KEYS.READING_PROGRESS, {});
  all[progress.mangaId] = { ...progress, timestamp: Date.now() };
  setItem(KEYS.READING_PROGRESS, all);
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
}

// ─── Read Later ────────────────────────────────────────────────────

export function addToReadLater(item: ReadLaterItem): void {
  const list = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  if (!list.find(i => i.mangaId === item.mangaId)) {
    list.unshift({ ...item, addedAt: Date.now() });
    setItem(KEYS.READ_LATER, list);
  }
}

export function removeFromReadLater(mangaId: string): void {
  const list = getItem<ReadLaterItem[]>(KEYS.READ_LATER, []);
  setItem(KEYS.READ_LATER, list.filter(i => i.mangaId !== mangaId));
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
  }
}

export function removeFromFavorites(mangaId: string): void {
  const list = getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  setItem(KEYS.FAVORITES, list.filter(i => i.mangaId !== mangaId));
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
  }
}

export function deleteReadingList(id: string): void {
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  setItem(KEYS.READING_LISTS, lists.filter(l => l.id !== id));
}

export function addMangaToList(listId: string, mangaId: string): void {
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const list = lists.find(l => l.id === listId);
  if (list && !list.mangaIds.includes(mangaId)) {
    list.mangaIds.push(mangaId);
    list.updatedAt = Date.now();
    setItem(KEYS.READING_LISTS, lists);
  }
}

export function removeMangaFromList(listId: string, mangaId: string): void {
  const lists = getItem<ReadingList[]>(KEYS.READING_LISTS, []);
  const list = lists.find(l => l.id === listId);
  if (list) {
    list.mangaIds = list.mangaIds.filter(id => id !== mangaId);
    list.updatedAt = Date.now();
    setItem(KEYS.READING_LISTS, lists);
  }
}

// ─── Reading History ───────────────────────────────────────────────

export function addToHistory(entry: ReadingHistoryEntry): void {
  const history = getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
  // Remove existing entry for same manga to avoid duplicates
  const filtered = history.filter(h => h.mangaId !== entry.mangaId);
  filtered.unshift({ ...entry, timestamp: Date.now() });
  // Keep only last 100 entries
  setItem(KEYS.READING_HISTORY, filtered.slice(0, 100));
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  return getItem<ReadingHistoryEntry[]>(KEYS.READING_HISTORY, []);
}

export function clearReadingHistory(): void {
  setItem(KEYS.READING_HISTORY, []);
}

// ─── Read Chapters ─────────────────────────────────────────────────

export function markChapterRead(chapterId: string): void {
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  chapters[chapterId] = true;
  setItem(KEYS.READ_CHAPTERS, chapters);
}

export function markChapterUnread(chapterId: string): void {
  const chapters = getItem<Record<string, boolean>>(KEYS.READ_CHAPTERS, {});
  delete chapters[chapterId];
  setItem(KEYS.READ_CHAPTERS, chapters);
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
  setItem(KEYS.READER_SETTINGS, { ...current, ...settings });
}

// ─── Recent Searches ───────────────────────────────────────────────

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
