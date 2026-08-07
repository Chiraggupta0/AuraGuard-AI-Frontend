import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ROUTES from '@/constants/routes.constants';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import LandingLayout from '@/layouts/LandingLayout';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import ProtectedRoutes from './protectedRoutes';
import RoleRoutes from './roleRoutes';
import {
  AIMonitoringPage,
  DashboardPage,
  ForgotPasswordPage,
  LandingPage,
  LoginPage,
  MeetingDetailsPage,
  MeetingRoomPage,
  MeetingsPage,
  ModerationPage,
  NotificationsPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  ReportsPage,
  ResetPasswordPage,
  SettingsPage,
} from './lazyImports';

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-300">Loading AuraGuard AI...</div>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<LandingLayout />}>
            <Route index element={<LandingPage />} />
          </Route>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
            <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
          </Route>
          <Route element={<ProtectedRoutes />}>
            <Route element={<AppLayout />}>
              <Route element={<DashboardLayout />}>
                <Route path={ROUTES.dashboard} element={<DashboardPage />} />
              </Route>
              <Route path={ROUTES.meetings} element={<MeetingsPage />} />
              <Route path="/app/meetings/:meetingId" element={<MeetingDetailsPage />} />
              <Route path="/app/meetings/:meetingId/room" element={<MeetingRoomPage />} />
              <Route path={ROUTES.aiMonitoring} element={<AIMonitoringPage />} />
              <Route element={<ModeratorLayout />}>
                <Route path={ROUTES.moderation} element={<ModerationPage />} />
              </Route>
              <Route element={<RoleRoutes resource="view-reports" />}>
                <Route path={ROUTES.reports} element={<ReportsPage />} />
              </Route>
              <Route path={ROUTES.notifications} element={<NotificationsPage />} />
              <Route path={ROUTES.profile} element={<ProfilePage />} />
              <Route path={ROUTES.settings} element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to={ROUTES.landing} replace />} />
          <Route path={ROUTES.notFound} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
