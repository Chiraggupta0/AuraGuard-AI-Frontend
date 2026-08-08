import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/store/auth.store';

export default function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isAuthLoading: state.isAuthLoading,
      setUser: state.setUser,
      clearAuth: state.clearAuth,
    })),
  );
}
