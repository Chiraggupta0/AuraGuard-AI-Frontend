import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ROUTES from '@/constants/routes.constants';
import AppLayout from '@/layouts/AppLayout';
import useAuth from '@/hooks/useAuth';
import LandingPage from '@/features/landing/pages/LandingPage';
import LoginPage from '@/features/authentication/pages/LoginPage';
import RegisterPage from '@/features/authentication/pages/RegisterPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import CreateRoomPage from '@/features/meetings/pages/CreateRoomPage';
import JoinRoomPage from '@/features/meetings/pages/JoinRoomPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import ReportsPage from '@/features/reports/pages/ReportsPage';

function NotFoundPage() {
  return <Navigate to={ROUTES.dashboard} replace />;
}

function RootRedirect() {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) return null;

  return <Navigate to={isAuthenticated ? ROUTES.dashboard : ROUTES.login} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path={ROUTES.landingPage} element={<LandingPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route element={<AppLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.reports} element={<ReportsPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
          <Route path={ROUTES.createRoom} element={<CreateRoomPage />} />
          <Route path={ROUTES.joinRoom} element={<JoinRoomPage />} />
        </Route>
        <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
