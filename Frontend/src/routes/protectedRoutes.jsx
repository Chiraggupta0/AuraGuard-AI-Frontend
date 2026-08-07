import { Navigate, Outlet } from 'react-router-dom';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';

export default function ProtectedRoutes({ resource }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (resource && !user?.role) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
