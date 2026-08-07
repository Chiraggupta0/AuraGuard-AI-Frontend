import { Link } from 'react-router-dom';
import { Button } from '@/components';
import ROUTES from '@/constants/routes.constants';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center text-slate-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-auraguard-300">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-300">The page you requested does not exist.</p>
        <Link to={ROUTES.dashboard} className="mt-5 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
