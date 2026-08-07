import Card from '@/components/ui/Card';
import NotificationBell from '../components/NotificationBell';
import NotificationDrawer from '../components/NotificationDrawer';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <NotificationBell />
      <Card>
        <NotificationDrawer />
      </Card>
    </div>
  );
}
