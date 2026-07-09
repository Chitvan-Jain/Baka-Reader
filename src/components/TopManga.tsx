import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, BookOpen, Crown, Trophy, Medal } from 'lucide-react';
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={14} className="text-gold" />;
    if (rank === 2) return <Trophy size={14} className="text-silver" />;
    if (rank === 3) return <Medal size={14} className="text-bronze" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gold/10 text-gold border-gold/30';
    if (rank === 2) return 'bg-silver/10 text-silver border-silver/30';
    if (rank === 3) return 'bg-bronze/10 text-bronze border-bronze/30';
    return 'bg-bg-tertiary text-text-muted border-transparent';
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-accent" />
        <h2 className="text-lg font-bold text-text-primary">Top 10 Manga</h2>
      </div>

      <div className="space-y-2">
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
                  className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg-tertiary transition-all"
                >
                  {/* Rank */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold ${getRankStyle(rank)}`}>
                    {getRankIcon(rank) || rank}
                  </div>

                  {/* Cover */}
                  <LazyImage
                    src={coverUrl}
                    alt={title}
                    className="w-11 h-15 rounded-lg overflow-hidden shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                      {title}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {rating && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Star size={10} className="text-warning fill-warning" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {follows !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Users size={10} />
                          {follows >= 1000 ? `${(follows / 1000).toFixed(1)}k` : follows}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Read button */}
                  <button className="shrink-0 p-1.5 rounded-lg bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <BookOpen size={14} />
                  </button>
                </Link>
              );
            })
        }
      </div>
    </section>
  );
}
