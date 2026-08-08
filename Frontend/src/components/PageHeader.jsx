export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-auraguard-400">{eyebrow}</p>
        ) : null}
        <h1 className="text-4xl font-bold text-slate-100">{title}</h1>
        {description ? <p className="text-lg text-slate-400 max-w-3xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
    </div>
  );
}
