import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  items: [],
  unreadCount: 0,
  pushNotification: (item) => set((state) => ({ items: [item, ...state.items], unreadCount: state.unreadCount + 1 })),
  markAllRead: () => set({ unreadCount: 0 }),
  clearNotifications: () => set({ items: [], unreadCount: 0 }),
}));
