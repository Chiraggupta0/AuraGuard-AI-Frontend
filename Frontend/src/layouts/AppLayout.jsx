import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { useUIStore } from '@/store/ui.store';

export default function AppLayout() {
  const { pathname } = useLocation();
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="min-h-screen lg:pl-72">
        <Navbar />
        <main className="w-full border-t border-slate-800">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
