export default function EmptyState({ title = 'Nothing here yet', message = 'Content will appear once data is available.' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
    </div>
  );
}
