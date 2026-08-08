import { FiInbox } from 'react-icons/fi';
import Button from './ui/Button';
import Card from './ui/Card';

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <Card className="py-12 text-center space-y-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-slate-800/50 p-4">
          <FiInbox className="h-8 w-8 text-slate-400" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      {actionLabel ? (
        <div className="pt-2">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
