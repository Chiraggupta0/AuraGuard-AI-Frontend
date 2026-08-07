export default function MetricChart({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-300">{hint}</p> : null}
    </div>
  );
}
