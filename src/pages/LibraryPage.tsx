import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Clock, BookMarked, History, Trash2, PlayCircle, BookOpen } from 'lucide-react';
import {
  getFavoritesList, getReadLaterList, getReadingHistory,
  getAllReadingProgress, removeFromFavorites, removeFromReadLater,
  removeReadingProgress, clearReadingHistory,
} from '../services/storage';
import { getMangaByIds } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl } from '../types';
import LazyImage from '../components/ui/LazyImage';
import { useToast } from '../components/ui/Toast';
import type { Manga } from '../types';

type Tab = 'continue' | 'favorites' | 'readlater' | 'history';

export default function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'continue';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [mangaMap, setMangaMap] = useState<Record<string, Manga>>({});
  const [loadingManga, setLoadingManga] = useState(false);
  const { addToast } = useToast();

  // Force re-render trick
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const progress = getAllReadingProgress();
  const favorites = getFavoritesList();
  const readLater = getReadLaterList();
  const history = getReadingHistory();

  // Fetch manga details for IDs we have
  useEffect(() => {
    const allIds = new Set<string>();
    progress.forEach(p => allIds.add(p.mangaId));
    favorites.forEach(f => allIds.add(f.mangaId));
    readLater.forEach(r => allIds.add(r.mangaId));
    history.forEach(h => allIds.add(h.mangaId));

    const idsToFetch = [...allIds].filter(id => !mangaMap[id]);
    if (idsToFetch.length === 0) return;

    setLoadingManga(true);
    const batches = [];
    for (let i = 0; i < idsToFetch.length; i += 100) {
      batches.push(idsToFetch.slice(i, i + 100));
    }

    Promise.all(batches.map(batch => getMangaByIds(batch)))
      .then(results => {
        const map: Record<string, Manga> = { ...mangaMap };
        results.forEach(res => {
          res.data.forEach(m => { map[m.id] = m; });
        });
        setMangaMap(map);
      })
      .finally(() => setLoadingManga(false));
  }, [activeTab]);

  const tabs = [
    { id: 'continue' as Tab, label: 'Continue', icon: PlayCircle, count: progress.length },
    { id: 'favorites' as Tab, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'readlater' as Tab, label: 'Read Later', icon: Clock, count: readLater.length },
    { id: 'history' as Tab, label: 'History', icon: History, count: history.length },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const renderMangaCard = (mangaId: string, extra: React.ReactNode, onRemove?: () => void) => {
    const manga = mangaMap[mangaId];
    const title = manga ? getMangaTitle(manga) : mangaId;
    const coverFile = manga ? getCoverFileName(manga) : undefined;
    const coverUrl = getCoverUrl(mangaId, coverFile, '256');

    return (
      <div key={mangaId} className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-tertiary transition-colors">
        <Link to={`/manga/${mangaId}`} className="shrink-0">
          <LazyImage src={coverUrl} alt={title} className="w-12 h-17 rounded-md overflow-hidden bg-bg-tertiary" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/manga/${mangaId}`} className="text-sm font-medium text-text-primary hover:text-accent transition-colors line-clamp-1">
            {title}
          </Link>
          <div className="mt-0.5">{extra}</div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    );
  };

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <div className="flex flex-col items-center py-14 text-center">
      <Icon size={32} className="text-text-muted mb-3" />
      <p className="text-text-secondary text-sm">{message}</p>
      <Link to="/" className="mt-3 text-sm text-accent hover:underline">Browse manga →</Link>
    </div>
  );

  return (
    <div className="site-container py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-5">Library</h1>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-6 p-1 rounded-lg bg-bg-secondary border border-border overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-bg-tertiary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        {activeTab === 'continue' && (
          progress.length === 0 ? <EmptyState icon={PlayCircle} message="No reading progress yet" /> : (
            <div className="space-y-0.5">
              {progress.map(p => renderMangaCard(
                p.mangaId,
                <div className="flex items-center gap-2">
                  <Link to={`/read/${p.chapterId}`} className="text-xs text-accent hover:underline">
                    Continue · p.{p.page + 1}/{p.totalPages}
                  </Link>
                  <div className="flex-1 h-1 rounded-full bg-bg-tertiary max-w-24">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(p.page / p.totalPages) * 100}%` }} />
                  </div>
                </div>,
                () => { removeReadingProgress(p.mangaId); refresh(); addToast('Removed', 'info'); }
              ))}
            </div>
          )
        )}

        {activeTab === 'favorites' && (
          favorites.length === 0 ? <EmptyState icon={Heart} message="No favorites yet" /> : (
            <div className="space-y-0.5">
              {favorites.map(f => renderMangaCard(
                f.mangaId,
                <p className="text-xs text-text-muted">Added {new Date(f.addedAt).toLocaleDateString()}</p>,
                () => { removeFromFavorites(f.mangaId); refresh(); addToast('Removed from favorites', 'info'); }
              ))}
            </div>
          )
        )}

        {activeTab === 'readlater' && (
          readLater.length === 0 ? <EmptyState icon={Clock} message="Read Later is empty" /> : (
            <div className="space-y-0.5">
              {readLater.map(r => renderMangaCard(
                r.mangaId,
                <p className="text-xs text-text-muted">Added {new Date(r.addedAt).toLocaleDateString()}</p>,
                () => { removeFromReadLater(r.mangaId); refresh(); addToast('Removed from Read Later', 'info'); }
              ))}
            </div>
          )
        )}

        {activeTab === 'history' && (
          history.length === 0 ? <EmptyState icon={History} message="No reading history" /> : (
            <>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => { clearReadingHistory(); refresh(); addToast('History cleared', 'info'); }}
                  className="text-xs text-text-muted hover:text-error transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-0.5">
                {history.map(h => renderMangaCard(
                  h.mangaId,
                  <p className="text-xs text-text-muted">
                    Ch. {h.chapterNumber || '?'} · {new Date(h.timestamp).toLocaleDateString()}
                  </p>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
