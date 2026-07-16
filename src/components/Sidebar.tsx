import TopManga from './TopManga';
import UserQuickAccess from './UserQuickAccess';

export default function Sidebar() {
  return (
    <aside className="space-y-3">
      <div className="sticky top-16">
        <div className="space-y-3 max-h-[calc(100vh-5rem)] overflow-y-auto hide-scrollbar pb-6">
          {/* Quick Access first so it's always visible */}
          <div className="p-4 rounded-lg bg-bg-secondary border border-border">
            <UserQuickAccess />
          </div>
          <div className="p-4 rounded-lg bg-bg-secondary border border-border">
            <TopManga />
          </div>
        </div>
      </div>
    </aside>
  );
}
