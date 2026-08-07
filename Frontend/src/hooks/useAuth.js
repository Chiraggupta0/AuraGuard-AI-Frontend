import { useAuthStore } from '@/store/auth.store';

export default function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
    setAuth: state.setAuth,
    clearAuth: state.clearAuth,
  }));
}
