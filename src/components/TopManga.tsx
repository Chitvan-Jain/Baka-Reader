import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, BookOpen } from 'lucide-react';
import { getPopularManga, getMangaStatistics, type MangaStatistics } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl } from '../types';
import LazyImage from './ui/LazyImage';
import { MangaCardSkeleton } from './ui/Skeleton';
import type { Manga } from '../types';

export default function TopManga() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [stats, setStats] = useState<MangaStatistics>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPopularManga(10)
      .then(async res => {
        setManga(res.data);
        // Fetch statistics for ratings
        const ids = res.data.map(m => m.id);
        if (ids.length > 0) {
          try {
            const statsRes = await getMangaStatistics(ids);
            setStats(statsRes.statistics);
          } catch {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="text-base font-semibold text-text-primary mb-3">Top 10</h2>

      <div className="space-y-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <MangaCardSkeleton key={i} />)
          : manga.map((m, i) => {
              const rank = i + 1;
              const title = getMangaTitle(m);
              const coverFile = getCoverFileName(m);
              const coverUrl = getCoverUrl(m.id, coverFile, '256');
              const mangaStats = stats[m.id];
              const rating = mangaStats?.rating?.bayesian;
              const follows = mangaStats?.follows;

              return (
                <Link
                  key={m.id}
                  to={`/manga/${m.id}`}
                  className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  {/* Rank number */}
                  <span className={`shrink-0 w-6 text-center text-sm font-bold ${rank <= 3 ? 'text-accent' : 'text-text-muted'}`}>
                    {rank}
                  </span>

                  {/* Cover */}
                  <LazyImage
                    src={coverUrl}
                    alt={title}
                    className="w-9 h-13 rounded-md overflow-hidden shrink-0 bg-bg-tertiary"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2.5 mt-0.5">
                      {rating && (
                        <span className="flex items-center gap-0.5 text-xs text-text-muted">
                          <Star size={10} className="text-warning fill-warning" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {follows !== undefined && (
                        <span className="flex items-center gap-0.5 text-xs text-text-muted">
                          <Users size={10} />
                          {follows >= 1000 ? `${(follows / 1000).toFixed(1)}k` : follows}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Read button on hover */}
                  <button className="shrink-0 p-1 rounded-md text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <BookOpen size={13} />
                  </button>
                </Link>
              );
            })
        }
      </div>
    </section>
  );
}
