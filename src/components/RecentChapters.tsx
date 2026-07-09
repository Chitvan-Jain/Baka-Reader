import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getRecentChapters } from '../services/mangadex';
import ChapterCard from './ChapterCard';
import { ChapterCardSkeleton } from './ui/Skeleton';
import type { Chapter } from '../types';

export default function RecentChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const LIMIT = 15;

  // Initial load
  useEffect(() => {
    getRecentChapters(0, LIMIT)
      .then(res => {
        setChapters(res.data);
        setHasMore(res.offset + res.limit < res.total);
        setOffset(LIMIT);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load chapters:', err);
        setLoading(false);
      });
  }, []);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getRecentChapters(offset, LIMIT);
      setChapters(prev => [...prev, ...res.data]);
      setHasMore(res.offset + res.limit < res.total);
      setOffset(prev => prev + LIMIT);
    } catch (err) {
      console.error('Failed to load more chapters:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [offset, loadingMore, hasMore]);

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
            getRecentChapters(0, LIMIT).then(res => {
              setChapters(res.data);
              setHasMore(res.offset + res.limit < res.total);
              setOffset(LIMIT);
              setLoading(false);
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
          : chapters.map(chapter => (
              <ChapterCard key={chapter.id} chapter={chapter} />
            ))
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
