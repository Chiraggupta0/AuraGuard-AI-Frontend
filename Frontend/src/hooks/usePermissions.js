import useAuth from './useAuth';

const ROLE_ACCESS = {
  admin: ['dashboard', 'meetings', 'ai-monitoring', 'moderation', 'reports', 'notifications', 'profile', 'settings'],
  moderator: ['dashboard', 'meetings', 'ai-monitoring', 'moderation', 'reports', 'notifications', 'profile'],
  user: ['dashboard', 'meetings', 'ai-monitoring', 'notifications', 'profile', 'settings'],
};

export default function usePermissions() {
  const { user } = useAuth();

  return {
    canAccess: (resource) => Boolean(user?.role && ROLE_ACCESS[user.role]?.includes(resource)),
  };
}
