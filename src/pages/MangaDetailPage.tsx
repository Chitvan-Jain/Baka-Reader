import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Heart, Clock, Star, Users, Calendar, Globe, ChevronDown,
  ChevronUp, Check, BookMarked, Play, ExternalLink, ArrowLeft, ListPlus, CheckCircle2
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
  getReadingLists, addMangaToList, removeMangaFromList,
} from '../services/storage';
import type { ReadingList } from '../types';
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
  const [showListMenu, setShowListMenu] = useState(false);
  const [readingLists, setReadingLists] = useState<ReadingList[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setChaptersLoading(true);
    setIsFav(isInFavorites(id));
    setIsRL(isInReadLater(id));
    setReadingLists(getReadingLists());

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
      <div className="site-container py-8 space-y-5">
        <Skeleton height={280} className="rounded-lg" />
        <Skeleton height={18} width="40%" />
        <Skeleton height={14} width="60%" />
        <Skeleton height={180} />
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
    <div className="site-container py-8 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors">
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cover */}
        <div className="shrink-0">
          <LazyImage
            src={coverUrl}
            alt={title}
            className="w-44 md:w-52 aspect-[3/4.3] rounded-lg overflow-hidden shadow-lg mx-auto md:mx-0 bg-bg-tertiary"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-3">
            <span className="flex items-center gap-1">
              <Users size={13} />
              {author}
              {artist && artist !== author && ` / ${artist}`}
            </span>
            {manga.attributes.year && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {manga.attributes.year}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
              manga.attributes.status === 'completed' ? 'bg-success/15 text-success' :
              manga.attributes.status === 'ongoing' ? 'bg-info/15 text-info' :
              'bg-warning/15 text-warning'
            }`}>
              {manga.attributes.status}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            {rating && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-warning fill-warning" />
                <span className="text-base font-semibold text-text-primary">{rating.toFixed(2)}</span>
              </div>
            )}
            {follows !== null && (
              <div className="flex items-center gap-1 text-text-secondary text-sm">
                <BookMarked size={13} />
                {follows.toLocaleString()} follows
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 10).map(tag => (
              <Link
                key={tag}
                to={`/search?q=${tag}`}
                className="px-2 py-0.5 rounded text-xs text-text-secondary bg-bg-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className={`text-sm text-text-secondary leading-relaxed ${showFullDesc ? '' : 'line-clamp-3'}`}>
              {cleanDesc}
            </p>
            {cleanDesc.length > 200 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-1 text-xs text-accent hover:underline flex items-center gap-0.5"
              >
                {showFullDesc ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {progress ? (
              <Link
                to={`/read/${progress.chapterId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-colors"
              >
                <Play size={14} fill="currentColor" />
                Continue Ch. {chapters.find(c => c.id === progress.chapterId)?.attributes.chapter || '?'} · p.{progress.page + 1}
              </Link>
            ) : chapters.length > 0 ? (
              <Link
                to={`/read/${chapters[chapters.length - 1].id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-colors"
              >
                <Play size={14} fill="currentColor" />
                Start Reading
              </Link>
            ) : null}
            <button
              onClick={handleFav}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFav ? 'bg-error/10 text-error border border-error/20' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={handleRL}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRL ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              <Clock size={14} />
              {isRL ? 'In Read Later' : 'Read Later'}
            </button>

            {/* Add to List */}
            <div className="relative">
              <button
                onClick={() => { setReadingLists(getReadingLists()); setShowListMenu(!showListMenu); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border transition-colors"
              >
                <ListPlus size={14} />
                Add to List
              </button>

              {showListMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowListMenu(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-56 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden z-40 animate-scale-in">
                    {readingLists.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-text-muted mb-2">No lists yet</p>
                        <Link
                          to="/lists"
                          onClick={() => setShowListMenu(false)}
                          className="text-xs text-accent hover:underline"
                        >
                          Create one →
                        </Link>
                      </div>
                    ) : (
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {readingLists.map(list => {
                          const isInList = list.mangaIds.includes(id!);
                          return (
                            <button
                              key={list.id}
                              onClick={() => {
                                if (isInList) {
                                  removeMangaFromList(list.id, id!);
                                  addToast(`Removed from "${list.name}"`, 'info');
                                } else {
                                  addMangaToList(list.id, id!);
                                  addToast(`Added to "${list.name}"`, 'success');
                                }
                                setReadingLists(getReadingLists());
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-bg-tertiary transition-colors"
                            >
                              {isInList ? (
                                <CheckCircle2 size={15} className="text-accent shrink-0" />
                              ) : (
                                <div className="w-[15px] h-[15px] rounded-full border border-border shrink-0" />
                              )}
                              <span className={`truncate ${isInList ? 'text-accent font-medium' : 'text-text-secondary'}`}>
                                {list.name}
                              </span>
                              <span className="text-xs text-text-muted ml-auto shrink-0">
                                {list.mangaIds.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Chapters <span className="text-text-muted font-normal text-sm">({chapters.length})</span>
        </h2>

        {chaptersLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <BookOpen size={28} className="mx-auto mb-2 text-text-muted" />
            <p>No chapters available in English</p>
          </div>
        ) : (
          <div className="space-y-0.5 bg-bg-secondary rounded-lg border border-border p-1.5">
            {chapters.map(ch => {
              const chRead = isChapterRead(ch.id);
              const groupRel = ch.relationships.find(r => r.type === 'scanlation_group');
              const groupName = groupRel?.attributes?.name || 'Unknown';

              return (
                <div
                  key={ch.id}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-bg-tertiary ${chRead ? 'opacity-40' : ''}`}
                >
                  {/* Read indicator */}
                  <button
                    onClick={() => {
                      if (chRead) markChapterUnread(ch.id);
                      else markChapterRead(ch.id);
                      setChapters([...chapters]);
                    }}
                    className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      chRead ? 'border-accent bg-accent' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {chRead && <Check size={8} className="text-white" />}
                  </button>

                  {/* Chapter info */}
                  <Link to={`/read/${ch.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-text-primary">
                        {ch.attributes.chapter ? `Chapter ${ch.attributes.chapter}` : 'Oneshot'}
                      </span>
                      {ch.attributes.title && (
                        <span className="text-sm text-text-muted truncate">— {ch.attributes.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>{getLanguageFlag(ch.attributes.translatedLanguage)}</span>
                      <span>{groupName}</span>
                      <span>{formatRelativeTime(ch.attributes.publishAt)}</span>
                      <span>{ch.attributes.pages}p</span>
                    </div>
                  </Link>

                  <Link
                    to={`/read/${ch.id}`}
                    className="shrink-0 p-1 rounded-md text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <BookOpen size={13} />
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
