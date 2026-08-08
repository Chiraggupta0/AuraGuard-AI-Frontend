import { useShallow } from 'zustand/react/shallow';
import { useNotificationStore } from '@/store/notification.store';

export default function useNotificationCenter() {
  return useNotificationStore(
    useShallow((state) => ({
      items: state.items,
      unreadCount: state.unreadCount,
      pushNotification: state.pushNotification,
      markAllRead: state.markAllRead,
      clearNotifications: state.clearNotifications,
    })),
  );
}
