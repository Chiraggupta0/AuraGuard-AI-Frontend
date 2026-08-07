export default function AuthFormShell({ title, subtitle, children }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-auraguard-300">{subtitle}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">{title}</h1>
      </div>
      {children}
    </div>
  );
}
