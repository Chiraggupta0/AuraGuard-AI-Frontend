import Card from '@/components/ui/Card';

export default function MeetingCard({ title, description }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </Card>
  );
}
