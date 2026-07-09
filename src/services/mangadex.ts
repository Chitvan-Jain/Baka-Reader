import type {
  ApiListResponse,
  AtHomeResponse,
  Chapter,
  Manga,
  Tag,
  SearchFilters,
} from '../types';

const API_BASE = '/api';

// Rate limiter: max 5 requests per second
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private readonly maxConcurrent = 3;
  private readonly interval = 220; // ~4.5 req/sec to stay under 5/sec

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    setTimeout(() => {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }, this.interval);
  }
}

const rateLimiter = new RateLimiter();

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  await rateLimiter.acquire();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } finally {
    rateLimiter.release();
  }
}

// ─── Chapter Endpoints ─────────────────────────────────────────────

export async function getRecentChapters(
  offset = 0,
  limit = 20,
  translatedLanguage = 'en'
): Promise<ApiListResponse<Chapter>> {
  const params = new URLSearchParams({
    'order[publishAt]': 'desc',
    limit: limit.toString(),
    offset: offset.toString(),
    'translatedLanguage[]': translatedLanguage,
    'includes[]': 'manga',
    includeFuturePublishAt: '0',
    'contentRating[]': 'safe',
  });
  // Need to add scanlation_group include separately since URLSearchParams overwrites
  params.append('includes[]', 'scanlation_group');
  params.append('contentRating[]', 'suggestive');

  return apiFetch<ApiListResponse<Chapter>>(`/chapter?${params}`);
}

export async function getChapterPages(chapterId: string): Promise<AtHomeResponse> {
  return apiFetch<AtHomeResponse>(`/at-home/server/${chapterId}`);
}

// ─── Manga Endpoints ───────────────────────────────────────────────

export async function getPopularManga(limit = 10): Promise<ApiListResponse<Manga>> {
  const params = new URLSearchParams({
    'order[followedCount]': 'desc',
    limit: limit.toString(),
    'includes[]': 'cover_art',
    'contentRating[]': 'safe',
  });
  params.append('contentRating[]', 'suggestive');

  return apiFetch<ApiListResponse<Manga>>(`/manga?${params}`);
}

export async function getTrendingManga(limit = 20): Promise<ApiListResponse<Manga>> {
  // "Trending" = recently updated + popular
  const params = new URLSearchParams({
    'order[followedCount]': 'desc',
    limit: limit.toString(),
    'includes[]': 'cover_art',
    'contentRating[]': 'safe',
    hasAvailableChapters: 'true',
  });
  params.append('contentRating[]', 'suggestive');

  return apiFetch<ApiListResponse<Manga>>(`/manga?${params}`);
}

export async function getRecentlyUpdatedManga(limit = 20): Promise<ApiListResponse<Manga>> {
  const params = new URLSearchParams({
    'order[latestUploadedChapter]': 'desc',
    limit: limit.toString(),
    'includes[]': 'cover_art',
    'contentRating[]': 'safe',
    hasAvailableChapters: 'true',
  });
  params.append('contentRating[]', 'suggestive');

  return apiFetch<ApiListResponse<Manga>>(`/manga?${params}`);
}

export async function getMangaDetails(mangaId: string): Promise<{ data: Manga }> {
  const params = new URLSearchParams();
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('includes[]', 'artist');

  return apiFetch<{ data: Manga }>(`/manga/${mangaId}?${params}`);
}

export async function getMangaFeed(
  mangaId: string,
  offset = 0,
  limit = 100,
  translatedLanguage = 'en'
): Promise<ApiListResponse<Chapter>> {
  const params = new URLSearchParams({
    'order[chapter]': 'desc',
    limit: limit.toString(),
    offset: offset.toString(),
    'translatedLanguage[]': translatedLanguage,
    'includes[]': 'scanlation_group',
    'contentRating[]': 'safe',
  });
  params.append('contentRating[]', 'suggestive');

  return apiFetch<ApiListResponse<Chapter>>(`/manga/${mangaId}/feed?${params}`);
}

export async function searchManga(
  filters: SearchFilters,
  offset = 0,
  limit = 20
): Promise<ApiListResponse<Manga>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    'includes[]': 'cover_art',
  });

  if (filters.title) params.set('title', filters.title);
  if (filters.author) params.set('authorOrArtist', filters.author);
  if (filters.year) params.set('year', filters.year.toString());

  if (filters.includedTags?.length) {
    filters.includedTags.forEach(tag => params.append('includedTags[]', tag));
  }
  if (filters.excludedTags?.length) {
    filters.excludedTags.forEach(tag => params.append('excludedTags[]', tag));
  }
  if (filters.status?.length) {
    filters.status.forEach(s => params.append('status[]', s));
  }
  if (filters.publicationDemographic?.length) {
    filters.publicationDemographic.forEach(d => params.append('publicationDemographic[]', d));
  }
  if (filters.contentRating?.length) {
    filters.contentRating.forEach(r => params.append('contentRating[]', r));
  } else {
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
  }
  if (filters.originalLanguage?.length) {
    filters.originalLanguage.forEach(l => params.append('originalLanguage[]', l));
  }

  // Sort
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    params.set(`order[${field}]`, direction || 'desc');
  } else {
    params.set('order[relevance]', 'desc');
  }

  return apiFetch<ApiListResponse<Manga>>(`/manga?${params}`);
}

export async function getMangaTags(): Promise<ApiListResponse<Tag>> {
  return apiFetch<ApiListResponse<Tag>>('/manga/tag');
}

// ─── Manga batch by IDs ────────────────────────────────────────────

export async function getMangaByIds(ids: string[]): Promise<ApiListResponse<Manga>> {
  if (ids.length === 0) {
    return { result: 'ok', response: 'collection', data: [], limit: 0, offset: 0, total: 0 };
  }
  const params = new URLSearchParams({ 'includes[]': 'cover_art', limit: '100' });
  ids.forEach(id => params.append('ids[]', id));
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('contentRating[]', 'erotica');

  return apiFetch<ApiListResponse<Manga>>(`/manga?${params}`);
}

// ─── Statistics ────────────────────────────────────────────────────

export interface MangaStatistics {
  [mangaId: string]: {
    rating: {
      average: number | null;
      bayesian: number;
    };
    follows: number;
  };
}

export async function getMangaStatistics(mangaIds: string[]): Promise<{ statistics: MangaStatistics }> {
  const params = new URLSearchParams();
  mangaIds.forEach(id => params.append('manga[]', id));
  return apiFetch<{ statistics: MangaStatistics }>(`/statistics/manga?${params}`);
}

// ─── Cover URL helpers ─────────────────────────────────────────────

export function buildCoverUrl(mangaId: string, fileName: string, size: '256' | '512' = '256'): string {
  return `/uploads/covers/${mangaId}/${fileName}.${size}.jpg`;
}

export function buildChapterImageUrl(baseUrl: string, hash: string, fileName: string, dataSaver = false): string {
  const quality = dataSaver ? 'data-saver' : 'data';
  return `${baseUrl}/${quality}/${hash}/${fileName}`;
}
