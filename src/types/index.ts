export interface MangaAttributes {
  title: Record<string, string>;
  altTitles: Record<string, string>[];
  description: Record<string, string>;
  isLocked: boolean;
  links: Record<string, string>;
  originalLanguage: string;
  lastVolume: string | null;
  lastChapter: string | null;
  publicationDemographic: string | null;
  status: string;
  year: number | null;
  contentRating: string;
  tags: Tag[];
  state: string;
  createdAt: string;
  updatedAt: string;
  availableTranslatedLanguages: string[];
}

export interface Tag {
  id: string;
  type: 'tag';
  attributes: {
    name: Record<string, string>;
    description: Record<string, string>;
    group: string;
    version: number;
  };
}

export interface Relationship {
  id: string;
  type: string;
  related?: string;
  attributes?: Record<string, any>;
}

export interface Manga {
  id: string;
  type: 'manga';
  attributes: MangaAttributes;
  relationships: Relationship[];
}

export interface ChapterAttributes {
  volume: string | null;
  chapter: string | null;
  title: string | null;
  translatedLanguage: string;
  externalUrl: string | null;
  publishAt: string;
  readableAt: string;
  createdAt: string;
  updatedAt: string;
  pages: number;
  version: number;
}

export interface Chapter {
  id: string;
  type: 'chapter';
  attributes: ChapterAttributes;
  relationships: Relationship[];
}

export interface ScanlationGroup {
  id: string;
  type: 'scanlation_group';
  attributes: {
    name: string;
    altNames: Record<string, string>[];
    locked: boolean;
    website: string | null;
    description: string;
  };
}

export interface CoverArt {
  id: string;
  type: 'cover_art';
  attributes: {
    description: string;
    volume: string | null;
    fileName: string;
    locale: string;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

export interface ApiResponse<T> {
  result: 'ok' | 'error';
  response: string;
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

export interface ApiListResponse<T> {
  result: 'ok' | 'error';
  response: string;
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface AtHomeResponse {
  result: 'ok';
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export interface UserProfile {
  username: string;
  isLoggedIn: boolean;
}

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  page: number;
  totalPages: number;
  timestamp: number;
  mangaTitle: string;
  coverFileName?: string;
}

export interface ReadLaterItem {
  mangaId: string;
  mangaTitle: string;
  coverFileName?: string;
  addedAt: number;
}

export interface FavoriteItem {
  mangaId: string;
  mangaTitle: string;
  coverFileName?: string;
  addedAt: number;
}

export interface ReadingList {
  id: string;
  name: string;
  description: string;
  mangaIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ReadingHistoryEntry {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber: string | null;
  coverFileName?: string;
  timestamp: number;
}

export type ReadingMode = 'vertical' | 'single' | 'double';

export interface ReaderSettings {
  mode: ReadingMode;
  fitToWidth: boolean;
  brightness: number;
  zoom: number;
}

export interface SearchFilters {
  title?: string;
  author?: string;
  includedTags?: string[];
  excludedTags?: string[];
  status?: string[];
  publicationDemographic?: string[];
  contentRating?: string[];
  originalLanguage?: string[];
  year?: number;
  sort?: string;
}

export interface MangaCardData {
  id: string;
  title: string;
  coverUrl: string;
  rating?: number;
  follows?: number;
  status?: string;
  description?: string;
  tags?: string[];
  lastChapter?: string;
}

// Helper to extract title from manga
export function getMangaTitle(manga: Manga): string {
  const titles = manga.attributes.title;
  return titles['en'] || titles['ja-ro'] || titles['ja'] || Object.values(titles)[0] || 'Unknown Title';
}

// Helper to get cover URL
export function getCoverUrl(mangaId: string, fileName: string | undefined, size: '256' | '512' = '256'): string {
  if (!fileName) return '/placeholder-cover.png';
  return `/uploads/covers/${mangaId}/${fileName}.${size}.jpg`;
}

// Helper to extract cover filename from manga relationships
export function getCoverFileName(manga: Manga): string | undefined {
  const coverRel = manga.relationships.find(r => r.type === 'cover_art');
  return coverRel?.attributes?.fileName;
}

// Helper to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return `${diffMonth}mo ago`;
}

// Language flag emoji map
export const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
  'zh-hk': '🇭🇰',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  'es-la': '🇲🇽',
  'pt-br': '🇧🇷',
  pt: '🇵🇹',
  it: '🇮🇹',
  ru: '🇷🇺',
  pl: '🇵🇱',
  tr: '🇹🇷',
  ar: '🇸🇦',
  th: '🇹🇭',
  vi: '🇻🇳',
  id: '🇮🇩',
  ms: '🇲🇾',
  tl: '🇵🇭',
  hi: '🇮🇳',
};

export function getLanguageFlag(lang: string): string {
  return languageFlags[lang] || '🏳️';
}

export function getLanguageName(lang: string): string {
  const names: Record<string, string> = {
    en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
    'zh-hk': 'Chinese (HK)', fr: 'French', de: 'German', es: 'Spanish',
    'es-la': 'Spanish (LA)', 'pt-br': 'Portuguese (BR)', pt: 'Portuguese',
    it: 'Italian', ru: 'Russian', pl: 'Polish', tr: 'Turkish',
    ar: 'Arabic', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
    ms: 'Malay', tl: 'Filipino', hi: 'Hindi',
  };
  return names[lang] || lang;
}
