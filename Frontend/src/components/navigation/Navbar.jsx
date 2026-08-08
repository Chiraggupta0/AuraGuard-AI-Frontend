import { FiLogOut, FiMenu, FiHome } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '@/constants';
import Button from '@/components/ui/Button';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';
import { signOutUser } from '@/features/authentication/services/firebaseAuth.service';
import { getDisplayName, getInitials } from '@/utils/formatters';
import { useUIStore } from '@/store/ui.store';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/create-room': 'Create Room',
  '/join-room': 'Join Room',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { user } = useAuth();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    await signOutUser();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <FiMenu className="h-5 w-5" />
            </Button>
            <Link to={ROUTES.dashboard} className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-auraguard-400 to-auraguard-600 flex items-center justify-center">
                  <FiHome className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{APP_NAME}</p>
                  <p className="text-sm font-semibold text-slate-100">{pageTitle}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Right section */}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-100">{displayName}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="h-9 w-9 rounded-full object-cover ring-2 ring-auraguard-500/20" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-auraguard-400 to-auraguard-600 text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Log out"
                title="Sign out"
              >
                <FiLogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link to={ROUTES.login}>
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
