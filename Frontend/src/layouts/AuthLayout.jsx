import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(57,171,255,0.16),_transparent_35%),linear-gradient(180deg,#07111f_0%,#0b1424_100%)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
        <Outlet />
      </div>
    </div>
  );
}
