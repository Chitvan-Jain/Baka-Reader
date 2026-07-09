import { Link } from 'react-router-dom';
import { PlayCircle, Clock, BookMarked, List, Heart, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllReadingProgress, getReadLaterList, getFavoritesList, getReadingHistory, getReadingLists } from '../services/storage';

export default function UserQuickAccess() {
  const { isAuthenticated } = useAuth();

  const progress = getAllReadingProgress();
  const readLater = getReadLaterList();
  const favorites = getFavoritesList();
  const history = getReadingHistory();
  const lists = getReadingLists();

  const sections = [
    {
      label: 'Continue Reading',
      icon: PlayCircle,
      count: progress.length,
      to: '/library?tab=continue',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Read Later',
      icon: Clock,
      count: readLater.length,
      to: '/library?tab=readlater',
      color: 'text-accent-secondary',
      bgColor: 'bg-accent-secondary/10',
    },
    {
      label: 'Favorites',
      icon: Heart,
      count: favorites.length,
      to: '/library?tab=favorites',
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
    {
      label: 'Reading Lists',
      icon: List,
      count: lists.length,
      to: '/lists',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Recently Read',
      icon: BookMarked,
      count: history.length,
      to: '/library?tab=history',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-accent-secondary" />
        <h2 className="text-lg font-bold text-text-primary">Quick Access</h2>
      </div>

      {!isAuthenticated && progress.length === 0 && readLater.length === 0 ? (
        <div className="flex flex-col items-center py-6 px-4 rounded-xl bg-bg-tertiary/50 border border-border text-center">
          <LogIn size={28} className="text-text-muted mb-3" />
          <p className="text-sm text-text-secondary mb-1">Sign in to MangaDex</p>
          <p className="text-xs text-text-muted">Sync your reading progress and library</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <Link
                key={section.label}
                to={section.to}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-bg-tertiary transition-all"
              >
                <div className={`shrink-0 w-9 h-9 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                  <Icon size={16} className={section.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{section.label}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {section.count > 0 && (
                    <span className="text-xs font-medium text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                      {section.count}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
