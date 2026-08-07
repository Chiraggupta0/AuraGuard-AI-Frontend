import { FiBell } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import useNotificationCenter from '@/hooks/useNotificationCenter';

export default function NotificationBell() {
  const { unreadCount } = useNotificationCenter();

  return (
    <div className="flex items-center gap-3 text-slate-100">
      <FiBell />
      <span>Notifications</span>
      {unreadCount > 0 ? <Badge tone="danger">{unreadCount}</Badge> : null}
    </div>
  );
}
