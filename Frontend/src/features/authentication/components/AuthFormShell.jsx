export default function AuthFormShell({ title, subtitle, children }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {subtitle ? <p className="text-xs font-semibold uppercase tracking-wider text-auraguard-400">{subtitle}</p> : null}
        <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
      </div>
      {children}
    </div>
  );
}
