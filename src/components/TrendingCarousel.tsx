import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrendingManga } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl } from '../types';
import LazyImage from './ui/LazyImage';
import type { Manga } from '../types';

export default function TrendingCarousel() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTrendingManga(20)
      .then(res => { setManga(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Trending</h2>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-32 h-44 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (manga.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Trending</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll('left')} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll('right')} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
      >
        {manga.map((m) => {
          const title = getMangaTitle(m);
          const coverFile = getCoverFileName(m);
          const coverUrl = getCoverUrl(m.id, coverFile, '512');

          return (
            <Link
              key={m.id}
              to={`/manga/${m.id}`}
              className="shrink-0 w-32 md:w-36 snap-start group"
            >
              <div className="relative rounded-lg overflow-hidden aspect-[3/4.2] mb-2 bg-bg-tertiary">
                <LazyImage
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[11px] font-medium text-white">View →</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                {title}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
