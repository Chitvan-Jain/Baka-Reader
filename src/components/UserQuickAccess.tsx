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
    },
    {
      label: 'Read Later',
      icon: Clock,
      count: readLater.length,
      to: '/library?tab=readlater',
    },
    {
      label: 'Favorites',
      icon: Heart,
      count: favorites.length,
      to: '/library?tab=favorites',
    },
    {
      label: 'Reading Lists',
      icon: List,
      count: lists.length,
      to: '/lists',
    },
    {
      label: 'History',
      icon: BookMarked,
      count: history.length,
      to: '/library?tab=history',
    },
  ];

  return (
    <section>
      <h2 className="text-base font-semibold text-text-primary mb-3">Quick Access</h2>

      {!isAuthenticated && progress.length === 0 && readLater.length === 0 ? (
        <div className="flex flex-col items-center py-5 px-3 rounded-lg bg-bg-tertiary text-center">
          <LogIn size={22} className="text-text-muted mb-2" />
          <p className="text-sm text-text-secondary mb-0.5">Sign in</p>
          <p className="text-xs text-text-muted">to sync your reading progress</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <Link
                key={section.label}
                to={section.to}
                className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <Icon size={15} className="shrink-0 text-text-muted" />
                <span className="flex-1 text-sm text-text-primary">{section.label}</span>
                <div className="flex items-center gap-1">
                  {section.count > 0 && (
                    <span className="text-xs text-text-muted bg-bg-tertiary group-hover:bg-bg-elevated px-1.5 py-0.5 rounded">
                      {section.count}
                    </span>
                  )}
                  <ChevronRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
