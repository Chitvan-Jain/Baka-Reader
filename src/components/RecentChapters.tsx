import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getRecentChapters, getMangaByIds } from '../services/mangadex';
import { getCoverFileName, getCoverUrl } from '../types';
import ChapterCard from './ChapterCard';
import { ChapterCardSkeleton } from './ui/Skeleton';
import type { Chapter } from '../types';

/**
 * Given a batch of chapters, extract unique manga IDs,
 * batch-fetch their manga data (with cover_art), and return
 * a map of mangaId → direct CDN cover URL.
 */
async function fetchCoverMap(chapters: Chapter[]): Promise<Record<string, string>> {
  const mangaIds = [...new Set(
    chapters
      .map(ch => ch.relationships.find(r => r.type === 'manga')?.id)
      .filter((id): id is string => !!id)
  )];

  if (mangaIds.length === 0) return {};

  const map: Record<string, string> = {};
  // Batch in groups of 100 (API limit)
  for (let i = 0; i < mangaIds.length; i += 100) {
    try {
      const res = await getMangaByIds(mangaIds.slice(i, i + 100));
      for (const manga of res.data) {
        const fileName = getCoverFileName(manga);
        if (fileName) {
          map[manga.id] = getCoverUrl(manga.id, fileName, '256');
        }
      }
    } catch (e) {
      console.error('Failed to fetch covers:', e);
    }
  }
  return map;
}

export default function RecentChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const LIMIT = 15;

  const loadCovers = useCallback(async (newChapters: Chapter[]) => {
    const newCovers = await fetchCoverMap(newChapters);
    setCoverMap(prev => ({ ...prev, ...newCovers }));
  }, []);

  // Initial load
  useEffect(() => {
    getRecentChapters(0, LIMIT)
      .then(async res => {
        setChapters(res.data);
        setHasMore(res.offset + res.limit < res.total);
        setOffset(LIMIT);
        setLoading(false);
        loadCovers(res.data);
      })
      .catch(err => {
        console.error('Failed to load chapters:', err);
        setLoading(false);
      });
  }, [loadCovers]);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getRecentChapters(offset, LIMIT);
      setChapters(prev => [...prev, ...res.data]);
      setHasMore(res.offset + res.limit < res.total);
      setOffset(prev => prev + LIMIT);
      loadCovers(res.data);
    } catch (err) {
      console.error('Failed to load more chapters:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [offset, loadingMore, hasMore, loadCovers]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Recently Uploaded</h2>
          <p className="text-sm text-text-secondary mt-0.5">Latest chapter releases</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setOffset(0);
            setCoverMap({});
            getRecentChapters(0, LIMIT).then(async res => {
              setChapters(res.data);
              setHasMore(res.offset + res.limit < res.total);
              setOffset(LIMIT);
              setLoading(false);
              loadCovers(res.data);
            });
          }}
          className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-bg-tertiary transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ChapterCardSkeleton key={i} />)
          : chapters.map(chapter => {
              const mangaId = chapter.relationships.find(r => r.type === 'manga')?.id || '';
              return (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  coverUrl={coverMap[mangaId]}
                />
              );
            })
        }
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={observerRef} className="py-4">
          {loadingMore && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <ChapterCardSkeleton key={i} />)}
            </div>
          )}
        </div>
      )}

      {!hasMore && chapters.length > 0 && (
        <p className="text-center text-sm text-text-muted py-6">You've reached the end ✦</p>
      )}
    </section>
  );
}
