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
        className={`fixed inset-0 z-20 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white/85 p-6 backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Aura<span className="text-auraguard-600">Guard</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">Meeting Safety Layer</p>
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
                      ? 'bg-auraguard-50 text-auraguard-700 border border-auraguard-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
        <div className="absolute bottom-6 left-6 right-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Pro Tip:</span> Use keyboard shortcut <kbd className="ml-1 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-600">ESC</kbd> to close this menu.
          </p>
        </div>
      </aside>
    </>
  );
}
