import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrendingManga } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl } from '../types';
import { BannerSkeleton } from './ui/Skeleton';
import type { Manga } from '../types';

export default function FeaturedBanner() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingManga(6)
      .then(res => { setManga(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (manga.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % manga.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [manga.length]);

  if (loading) return <BannerSkeleton />;
  if (manga.length === 0) return null;

  const featured = manga[current];
  const title = getMangaTitle(featured);
  const coverFile = getCoverFileName(featured);
  const coverUrl = getCoverUrl(featured.id, coverFile, '512');
  const description = featured.attributes.description['en'] || Object.values(featured.attributes.description)[0] || '';
  const tags = featured.attributes.tags
    .filter(t => t.attributes.group === 'genre')
    .slice(0, 4)
    .map(t => t.attributes.name['en'] || Object.values(t.attributes.name)[0]);

  const prev = () => setCurrent(c => (c - 1 + manga.length) % manga.length);
  const next = () => setCurrent(c => (c + 1) % manga.length);

  return (
    <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden group">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-bg-primary/30" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-2xl">
        <div className="animate-fade-in" key={current}>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight line-clamp-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-5 max-w-lg">
            {description.replace(/<[^>]*>/g, '').slice(0, 200)}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              to={`/manga/${featured.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all hover:shadow-glow"
            >
              <Play size={16} fill="currentColor" />
              Start Reading
            </Link>
            <Link
              to={`/manga/${featured.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all backdrop-blur-sm"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={prev} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm">
          <ChevronLeft size={18} />
        </button>
        <button onClick={next} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {manga.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-accent' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}
