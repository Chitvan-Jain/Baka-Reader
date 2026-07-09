import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
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
      <section className="mt-10">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={20} className="text-accent" />
          <h2 className="text-xl font-bold text-text-primary">Trending Now</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36 h-52 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (manga.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          <h2 className="text-xl font-bold text-text-primary">Trending Now</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll('left')} className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll('right')} className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
      >
        {manga.map((m, i) => {
          const title = getMangaTitle(m);
          const coverFile = getCoverFileName(m);
          const coverUrl = getCoverUrl(m.id, coverFile, '512');

          return (
            <Link
              key={m.id}
              to={`/manga/${m.id}`}
              className="shrink-0 w-36 md:w-40 snap-start group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative rounded-xl overflow-hidden aspect-[3/4.2] mb-2">
                <LazyImage
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-xs font-medium text-white">Read Now →</span>
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
