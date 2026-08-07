import { FiBell, FiMenu } from 'react-icons/fi';
import { APP_NAME } from '@/constants';
import Button from '@/components/ui/Button';
import { useNotificationStore } from '@/store/notification.store';
import { useUIStore } from '@/store/ui.store';

export default function Navbar() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <FiMenu />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-auraguard-300">{APP_NAME}</p>
            <h1 className="text-lg font-semibold text-slate-100">Command Center</h1>
          </div>
        </div>
        <button className="relative rounded-full border border-white/10 bg-white/5 p-3 text-slate-100 transition hover:bg-white/10" type="button">
          <FiBell />
          {unreadCount > 0 ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-400" /> : null}
        </button>
      </div>
    </header>
  );
}
