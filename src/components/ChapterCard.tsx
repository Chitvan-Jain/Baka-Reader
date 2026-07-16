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
    <div className="group flex gap-3 p-3 rounded-lg bg-bg-secondary border border-border hover:border-border-hover transition-colors animate-fade-in">
      {/* Cover thumbnail */}
      <Link to={`/manga/${mangaId}`} className="shrink-0">
        <LazyImage
          src={coverUrl || ''}
          alt={mangaTitle}
          className="w-14 h-20 md:w-16 md:h-22 rounded-md overflow-hidden bg-bg-tertiary"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/manga/${mangaId}`}
              className="text-sm font-medium text-text-primary hover:text-accent transition-colors line-clamp-1"
            >
              {mangaTitle}
            </Link>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
              {chapterNum && <span>Ch. {chapterNum}</span>}
              {chapterTitle && <span className="text-text-muted"> — {chapterTitle}</span>}
            </p>
          </div>
          <span className="shrink-0 text-sm" title={lang}>
            {getLanguageFlag(lang)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted">
          <span>{formatRelativeTime(publishAt)}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-text-muted/50" />
          <span className="truncate">{groupName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2">
          <Link
            to={`/read/${chapter.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            <BookOpen size={12} />
            Read
          </Link>
          <button
            onClick={handleReadLater}
            className={`p-1 rounded-md transition-colors ${inReadLater ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'}`}
            title={inReadLater ? 'Remove from Read Later' : 'Add to Read Later'}
          >
            <ClockIcon size={13} />
          </button>
          <button
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            title="Bookmark"
          >
            <Bookmark size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
