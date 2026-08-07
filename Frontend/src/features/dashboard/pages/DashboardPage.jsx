import Card from '@/components/ui/Card';
import MetricChart from '@/components/charts/MetricChart';
import DashboardHeader from '../components/DashboardHeader';
import MetricOverview from '../components/MetricOverview';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <MetricOverview />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <MetricChart title="Active meeting risk" value="Low" hint="Live analysis is stable across monitored rooms." />
        </Card>
        <Card>
          <MetricChart title="Moderator actions" value="24" hint="Actions taken in the last 24 hours." />
        </Card>
      </div>
    </div>
  );
}
