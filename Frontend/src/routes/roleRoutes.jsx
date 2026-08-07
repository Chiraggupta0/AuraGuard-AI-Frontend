import { Navigate, Outlet } from 'react-router-dom';
import ROUTES from '@/constants/routes.constants';
import usePermissions from '@/hooks/usePermissions';

export default function RoleRoutes({ resource }) {
  const { canAccess } = usePermissions();

  if (!canAccess(resource)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
