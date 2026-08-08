import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isAuthLoading: false }),
  clearAuth: () => set({ user: null, isAuthenticated: false, isAuthLoading: false }),
}));
