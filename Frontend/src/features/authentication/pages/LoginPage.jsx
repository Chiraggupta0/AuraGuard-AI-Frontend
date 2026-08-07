import { Link } from 'react-router-dom';
import { Button, Input } from '@/components';
import ROUTES from '@/constants/routes.constants';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-auraguard-300">Welcome back</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Sign in to AuraGuard AI</h1>
      </div>
      <form className="space-y-4">
        <Input label="Email" type="email" placeholder="you@company.com" />
        <Input label="Password" type="password" placeholder="••••••••" />
        <Button className="w-full" type="submit">Sign In</Button>
      </form>
      <div className="flex items-center justify-between text-sm text-slate-300">
        <Link to={ROUTES.forgotPassword}>Forgot password?</Link>
        <Link to={ROUTES.register}>Create account</Link>
      </div>
    </div>
  );
}
