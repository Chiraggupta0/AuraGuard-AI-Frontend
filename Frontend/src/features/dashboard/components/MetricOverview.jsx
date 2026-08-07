import Card from '@/components/ui/Card';

export default function MetricOverview() {
  const metrics = [
    { label: 'Meetings monitored', value: '128' },
    { label: 'Alerts resolved', value: '41' },
    { label: 'Escalations', value: '7' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <p className="text-sm text-slate-400">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{metric.value}</p>
        </Card>
      ))}
    </div>
  );
}
