import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/errorParser';
import AuthLayout from '@/layouts/AuthLayout';
import AuthFormShell from '../components/AuthFormShell';
import useAuthForm from '../hooks/useAuthForm';
import { loginSchema } from '../validation/auth.validation';
import { signInWithEmail, signInWithGoogle } from '../services/firebaseAuth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const [formError, setFormError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useAuthForm(loginSchema, { email: '', password: '' });

  if (isAuthLoading) return null;
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard} replace />;

  const onSubmit = async ({ email, password }) => {
    setFormError('');
    setLoadingProvider('email');
    try {
      await signInWithEmail(email, password);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setFormError(getFirebaseErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    setLoadingProvider('google');
    try {
      await signInWithGoogle();
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setFormError(getFirebaseErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  };

  const isSubmitting = loadingProvider !== null;

  return (
    <AuthLayout>
      <AuthFormShell title="Welcome back" subtitle="Sign in to your account">
        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            disabled={isSubmitting}
            autoComplete="email"
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isSubmitting}
            autoComplete="current-password"
            {...register('password')}
          />
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {loadingProvider === 'email' ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    opacity="0.75"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs font-medium text-slate-500">OR</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <Button
          variant="secondary"
          className="w-full"
          type="button"
          disabled={isSubmitting}
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="text-lg" />
          {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to={ROUTES.register} className="font-medium text-auraguard-600 hover:text-auraguard-700 transition-colors">
            Create one
          </Link>
        </p>
      </AuthFormShell>
    </AuthLayout>
  );
}
