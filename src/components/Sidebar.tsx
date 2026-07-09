import TopManga from './TopManga';
import UserQuickAccess from './UserQuickAccess';

export default function Sidebar() {
  return (
    <aside className="space-y-2">
      <div className="sticky top-20">
        <div className="space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto hide-scrollbar pb-8">
          <div className="p-4 rounded-2xl bg-bg-secondary border border-border">
            <TopManga />
          </div>
          <div className="p-4 rounded-2xl bg-bg-secondary border border-border">
            <UserQuickAccess />
          </div>
        </div>
      </div>
    </aside>
  );
}
