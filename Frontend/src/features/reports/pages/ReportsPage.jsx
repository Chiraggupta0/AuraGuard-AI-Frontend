import Card from '@/components/ui/Card';
import ReportFilters from '../components/ReportFilters';
import ReportList from '../components/ReportList';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <ReportFilters />
      <Card>
        <ReportList />
      </Card>
    </div>
  );
}
