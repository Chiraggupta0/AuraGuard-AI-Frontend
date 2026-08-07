import { useNotificationStore } from '@/store/notification.store';

export default function useNotificationCenter() {
  return useNotificationStore((state) => ({
    items: state.items,
    unreadCount: state.unreadCount,
    pushNotification: state.pushNotification,
    markAllRead: state.markAllRead,
    clearNotifications: state.clearNotifications,
  }));
}
