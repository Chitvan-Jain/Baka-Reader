import { Link } from 'react-router-dom';
import { BookOpen, Clock as ClockIcon, Bookmark } from 'lucide-react';
import LazyImage from './ui/LazyImage';
import { getLanguageFlag, formatRelativeTime } from '../types';
import { addToReadLater, isInReadLater, removeFromReadLater } from '../services/storage';
import { useToast } from './ui/Toast';
import { useState } from 'react';
import type { Chapter, Manga } from '../types';

interface ChapterCardProps {
  chapter: Chapter;
  coverUrl?: string;
}

export default function ChapterCard({ chapter, coverUrl }: ChapterCardProps) {
  const { addToast } = useToast();

  // Extract manga info from relationships
  const mangaRel = chapter.relationships.find(r => r.type === 'manga');
  const mangaId = mangaRel?.id || '';
  const mangaAttrs = mangaRel?.attributes as Manga['attributes'] | undefined;
  const mangaTitle = mangaAttrs?.title
    ? (mangaAttrs.title['en'] || mangaAttrs.title['ja-ro'] || mangaAttrs.title['ja'] || Object.values(mangaAttrs.title)[0] || 'Unknown')
    : 'Unknown Manga';

  // Group info
  const groupRel = chapter.relationships.find(r => r.type === 'scanlation_group');
  const groupName = groupRel?.attributes?.name || 'Unknown Group';

  const chapterNum = chapter.attributes.chapter;
  const chapterTitle = chapter.attributes.title;
  const lang = chapter.attributes.translatedLanguage;
  const publishAt = chapter.attributes.publishAt;

  const [inReadLater, setInReadLater] = useState(() => isInReadLater(mangaId));

  const handleReadLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inReadLater) {
      removeFromReadLater(mangaId);
      setInReadLater(false);
      addToast('Removed from Read Later', 'info');
    } else {
      addToReadLater({ mangaId, mangaTitle, addedAt: Date.now() });
      setInReadLater(true);
      addToast('Added to Read Later', 'success');
    }
  };

  return (
    <div className="group flex gap-4 p-4 rounded-xl bg-bg-secondary border border-transparent hover:border-border-hover hover:shadow-card transition-all duration-300 animate-fade-in">
      {/* Cover thumbnail */}
      <Link to={`/manga/${mangaId}`} className="shrink-0">
        <LazyImage
          src={coverUrl || ''}
          alt={mangaTitle}
          className="w-16 h-22 md:w-18 md:h-25 rounded-lg overflow-hidden bg-bg-tertiary cursor-pointer hover:ring-2 hover:ring-accent/40 transition-all"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/manga/${mangaId}`}
              className="text-sm font-semibold text-text-primary hover:text-accent transition-colors line-clamp-1"
            >
              {mangaTitle}
            </Link>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
              {chapterNum && <span>Ch. {chapterNum}</span>}
              {chapterTitle && <span className="text-text-muted"> — {chapterTitle}</span>}
            </p>
          </div>
          {/* Language badge */}
          <span className="shrink-0 text-sm" title={lang}>
            {getLanguageFlag(lang)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
          <span>{formatRelativeTime(publishAt)}</span>
          <span>·</span>
          <span className="truncate">{groupName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2.5">
          <Link
            to={`/read/${chapter.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
          >
            <BookOpen size={13} />
            Read
          </Link>
          <button
            onClick={handleReadLater}
            className={`p-1.5 rounded-lg transition-colors ${inReadLater ? 'bg-accent-secondary/20 text-accent-secondary' : 'bg-bg-tertiary text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
            title={inReadLater ? 'Remove from Read Later' : 'Add to Read Later'}
          >
            <ClockIcon size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-bg-tertiary text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Bookmark"
          >
            <Bookmark size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
