import { Link } from 'react-router-dom';
import Button from './ui/Button';
import Card from './ui/Card';

export default function StatCard({ title, description, actionLabel, to }) {
  return (
    <Card className="flex h-full flex-col justify-between gap-6 border-slate-200 bg-gradient-to-br from-white to-slate-50/80 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-auraguard-500/10 hover:-translate-y-0.5">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && to ? (
        <Button as={Link} to={to} className="w-full">
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
