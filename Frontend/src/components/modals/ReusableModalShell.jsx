export default function ReusableModalShell({ title, children, footer }) {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-glow">
      {title ? <h2 className="text-xl font-semibold text-slate-100">{title}</h2> : null}
      <div className="mt-4 text-sm text-slate-300">{children}</div>
      {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
    </div>
  );
}
