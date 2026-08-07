import Button from '@/components/ui/Button';

export default function ErrorState({ title = 'Unable to load data', message = 'Please try again.', onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-slate-100">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
      {onRetry ? <Button className="mt-4" onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}
