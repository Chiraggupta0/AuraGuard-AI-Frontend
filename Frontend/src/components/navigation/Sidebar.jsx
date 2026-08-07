import { NavLink } from 'react-router-dom';
import ROUTES from '@/constants/routes.constants';
import { useUIStore } from '@/store/ui.store';

const links = [
  { label: 'Dashboard', to: ROUTES.dashboard },
  { label: 'Meetings', to: ROUTES.meetings },
  { label: 'AI Monitoring', to: ROUTES.aiMonitoring },
  { label: 'Moderation', to: ROUTES.moderation },
  { label: 'Reports', to: ROUTES.reports },
  { label: 'Profile', to: ROUTES.profile },
  { label: 'Settings', to: ROUTES.settings },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <aside className={`fixed left-0 top-0 z-30 h-full w-72 border-r border-white/10 bg-slate-950/95 p-5 backdrop-blur-xl transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-sm font-semibold text-slate-100">AuraGuard AI</p>
        <p className="mt-1 text-xs text-slate-400">Privacy and safety layer</p>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-auraguard-500/15 text-auraguard-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
