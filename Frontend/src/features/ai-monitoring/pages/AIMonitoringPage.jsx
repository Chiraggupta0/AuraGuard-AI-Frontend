import Card from '@/components/ui/Card';
import AlertFeed from '../components/AlertFeed';
import LiveRiskBadge from '../components/LiveRiskBadge';

export default function AIMonitoringPage() {
  return (
    <div className="space-y-6">
      <LiveRiskBadge />
      <Card>
        <AlertFeed />
      </Card>
    </div>
  );
}
