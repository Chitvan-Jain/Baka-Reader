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
    .slice(0, 3)
    .map(t => t.attributes.name['en'] || Object.values(t.attributes.name)[0]);

  const prev = () => setCurrent(c => (c - 1 + manga.length) % manga.length);
  const next = () => setCurrent(c => (c + 1) % manga.length);

  return (
    <div className="relative w-full h-64 md:h-[22rem] rounded-lg overflow-hidden group">
      {/* Background */}
      <img
        src={coverUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        referrerPolicy="no-referrer"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-xl">
        <div className="animate-fade-in" key={current}>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded text-[11px] font-medium bg-white/15 text-white/90 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight line-clamp-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-5 max-w-md">
            {description.replace(/<[^>]*>/g, '').slice(0, 180)}
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              to={`/manga/${featured.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors"
            >
              <Play size={14} fill="currentColor" />
              Start Reading
            </Link>
            <Link
              to={`/manga/${featured.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
            >
              Details
            </Link>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={prev} className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <button onClick={next} className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {manga.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}
