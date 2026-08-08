import { NavLink } from 'react-router-dom';
import { FiX, FiBarChart2, FiHome, FiUser } from 'react-icons/fi';
import ROUTES from '@/constants/routes.constants';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/store/ui.store';

const links = [
  { label: 'Dashboard', to: ROUTES.dashboard, icon: FiHome },
  { label: 'Reports', to: ROUTES.reports, icon: FiBarChart2 },
  { label: 'Profile', to: ROUTES.profile, icon: FiUser },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  return (
    <>
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-800 bg-slate-950/95 p-6 backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Aura<span className="text-auraguard-400">Guard</span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">Meeting Safety Layer</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-auraguard-500/10 text-auraguard-300 border border-auraguard-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="absolute bottom-6 left-6 right-6 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Pro Tip:</span> Use keyboard shortcut <kbd className="ml-1 rounded bg-slate-800 px-2 py-1 font-mono text-xs">ESC</kbd> to close this menu.
          </p>
        </div>
      </aside>
    </>
  );
}
