import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Heart, Clock, Star, Users, Calendar, Globe, ChevronDown,
  ChevronUp, Check, BookMarked, Play, ExternalLink, ArrowLeft
} from 'lucide-react';
import { getMangaDetails, getMangaFeed, getMangaStatistics } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl, formatRelativeTime, getLanguageFlag } from '../types';
import LazyImage from '../components/ui/LazyImage';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import {
  addToFavorites, removeFromFavorites, isInFavorites,
  addToReadLater, removeFromReadLater, isInReadLater,
  getReadingProgress, isChapterRead, markChapterRead, markChapterUnread,
} from '../services/storage';
import type { Manga, Chapter } from '../types';

export default function MangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isRL, setIsRL] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [follows, setFollows] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setChaptersLoading(true);
    setIsFav(isInFavorites(id));
    setIsRL(isInReadLater(id));

    getMangaDetails(id)
      .then(res => { setManga(res.data); setLoading(false); })
      .catch(() => setLoading(false));

    getMangaFeed(id, 0, 100)
      .then(res => { setChapters(res.data); setChaptersLoading(false); })
      .catch(() => setChaptersLoading(false));

    getMangaStatistics([id])
      .then(res => {
        const s = res.statistics[id];
        if (s) {
          setRating(s.rating?.bayesian || null);
          setFollows(s.follows);
        }
      })
      .catch(() => {});
  }, [id]);

  if (loading || !manga) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <Skeleton height={300} className="rounded-2xl" />
        <Skeleton height={20} width="40%" />
        <Skeleton height={16} width="60%" />
        <Skeleton height={200} />
      </div>
    );
  }

  const title = getMangaTitle(manga);
  const coverFile = getCoverFileName(manga);
  const coverUrl = getCoverUrl(manga.id, coverFile, '512');
  const description = manga.attributes.description['en'] || Object.values(manga.attributes.description)[0] || '';
  const cleanDesc = description.replace(/<[^>]*>/g, '');
  const author = manga.relationships.find(r => r.type === 'author')?.attributes?.name || 'Unknown';
  const artist = manga.relationships.find(r => r.type === 'artist')?.attributes?.name;
  const tags = manga.attributes.tags.map(t => t.attributes.name['en'] || Object.values(t.attributes.name)[0]);
  const progress = id ? getReadingProgress(id) : null;

  const handleFav = () => {
    if (!id) return;
    if (isFav) {
      removeFromFavorites(id);
      setIsFav(false);
      addToast('Removed from favorites', 'info');
    } else {
      addToFavorites({ mangaId: id, mangaTitle: title, coverFileName: coverFile, addedAt: Date.now() });
      setIsFav(true);
      addToast('Added to favorites', 'success');
    }
  };

  const handleRL = () => {
    if (!id) return;
    if (isRL) {
      removeFromReadLater(id);
      setIsRL(false);
      addToast('Removed from Read Later', 'info');
    } else {
      addToReadLater({ mangaId: id, mangaTitle: title, coverFileName: coverFile, addedAt: Date.now() });
      setIsRL(true);
      addToast('Added to Read Later', 'success');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Cover */}
        <div className="shrink-0">
          <LazyImage
            src={coverUrl}
            alt={title}
            className="w-48 md:w-56 aspect-[3/4.3] rounded-2xl overflow-hidden shadow-card mx-auto md:mx-0"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {author}
              {artist && artist !== author && ` / ${artist}`}
            </span>
            {manga.attributes.year && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {manga.attributes.year}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              manga.attributes.status === 'completed' ? 'bg-success/15 text-success' :
              manga.attributes.status === 'ongoing' ? 'bg-info/15 text-info' :
              'bg-warning/15 text-warning'
            }`}>
              {manga.attributes.status}
            </span>
            {manga.attributes.publicationDemographic && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-secondary/15 text-accent-secondary capitalize">
                {manga.attributes.publicationDemographic}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 mb-5">
            {rating && (
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-warning fill-warning" />
                <span className="text-lg font-bold text-text-primary">{rating.toFixed(2)}</span>
              </div>
            )}
            {follows !== null && (
              <div className="flex items-center gap-1.5 text-text-secondary">
                <BookMarked size={14} />
                <span className="text-sm">{follows.toLocaleString()} follows</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tags.slice(0, 10).map(tag => (
              <Link
                key={tag}
                to={`/search?q=${tag}`}
                className="px-2.5 py-1 rounded-lg bg-bg-tertiary text-xs text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Description */}
          <div className="mb-5">
            <p className={`text-sm text-text-secondary leading-relaxed ${showFullDesc ? '' : 'line-clamp-3'}`}>
              {cleanDesc}
            </p>
            {cleanDesc.length > 200 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-1 text-xs text-accent hover:underline flex items-center gap-1"
              >
                {showFullDesc ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {progress ? (
              <Link
                to={`/read/${progress.chapterId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all hover:shadow-glow"
              >
                <Play size={16} fill="currentColor" />
                Continue Ch. {chapters.find(c => c.id === progress.chapterId)?.attributes.chapter || '?'} · p.{progress.page + 1}
              </Link>
            ) : chapters.length > 0 ? (
              <Link
                to={`/read/${chapters[chapters.length - 1].id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all hover:shadow-glow"
              >
                <Play size={16} fill="currentColor" />
                Start Reading
              </Link>
            ) : null}
            <button
              onClick={handleFav}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isFav ? 'bg-error/15 text-error border border-error/30' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={handleRL}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isRL ? 'bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              <Clock size={16} />
              {isRL ? 'In Read Later' : 'Read Later'}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">
            Chapters <span className="text-text-muted font-normal text-base">({chapters.length})</span>
          </h2>
        </div>

        {chaptersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <BookOpen size={32} className="mx-auto mb-3 text-text-muted" />
            <p>No chapters available in English</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chapters.map(ch => {
              const chRead = isChapterRead(ch.id);
              const groupRel = ch.relationships.find(r => r.type === 'scanlation_group');
              const groupName = groupRel?.attributes?.name || 'Unknown';

              return (
                <div
                  key={ch.id}
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-bg-tertiary ${chRead ? 'opacity-60' : ''}`}
                >
                  {/* Read indicator */}
                  <button
                    onClick={() => {
                      if (chRead) markChapterUnread(ch.id);
                      else markChapterRead(ch.id);
                      // Force re-render
                      setChapters([...chapters]);
                    }}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      chRead ? 'border-accent bg-accent' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {chRead && <Check size={10} className="text-white" />}
                  </button>

                  {/* Chapter info */}
                  <Link to={`/read/${ch.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {ch.attributes.chapter ? `Chapter ${ch.attributes.chapter}` : 'Oneshot'}
                      </span>
                      {ch.attributes.title && (
                        <span className="text-sm text-text-secondary truncate">— {ch.attributes.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span>{getLanguageFlag(ch.attributes.translatedLanguage)}</span>
                      <span>{groupName}</span>
                      <span>{formatRelativeTime(ch.attributes.publishAt)}</span>
                      <span>{ch.attributes.pages}p</span>
                    </div>
                  </Link>

                  {/* Read button */}
                  <Link
                    to={`/read/${ch.id}`}
                    className="shrink-0 p-2 rounded-lg bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <BookOpen size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
