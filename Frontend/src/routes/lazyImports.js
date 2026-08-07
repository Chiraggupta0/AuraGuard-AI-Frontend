import { lazy } from 'react';

export const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'));
export const LoginPage = lazy(() => import('@/features/authentication/pages/LoginPage'));
export const RegisterPage = lazy(() => import('@/features/authentication/pages/RegisterPage'));
export const ForgotPasswordPage = lazy(() => import('@/features/authentication/pages/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('@/features/authentication/pages/ResetPasswordPage'));
export const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
export const MeetingsPage = lazy(() => import('@/features/meetings/pages/MeetingsPage'));
export const MeetingDetailsPage = lazy(() => import('@/features/meetings/pages/MeetingDetailsPage'));
export const MeetingRoomPage = lazy(() => import('@/features/meetings/pages/MeetingRoomPage'));
export const AIMonitoringPage = lazy(() => import('@/features/ai-monitoring/pages/AIMonitoringPage'));
export const ModerationPage = lazy(() => import('@/features/moderation/pages/ModerationPage'));
export const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
export const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
export const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
export const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
export const NotFoundPage = lazy(() => import('@/features/system/pages/NotFoundPage'));
