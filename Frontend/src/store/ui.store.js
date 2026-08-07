import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  theme: 'dark',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
