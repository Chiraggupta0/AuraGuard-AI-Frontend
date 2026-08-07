import { Outlet } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Outlet />
    </div>
  );
}
