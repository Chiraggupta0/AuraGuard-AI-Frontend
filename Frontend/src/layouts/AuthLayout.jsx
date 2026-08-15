import { Link } from 'react-router-dom';
import ROUTES from '@/constants/routes.constants';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold text-slate-900">
              Aura<span className="text-auraguard-600">Guard</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">AI-powered meeting safety</p>
          </Link>
        </div>

        {/* Auth form card */}
        <div className="rounded-lg border border-slate-200 bg-white/80 shadow-xl backdrop-blur-xl p-8 space-y-6">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© 2026 AuraGuard AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
