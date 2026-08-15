export default function Breadcrumbs({ items = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          <span className={index === items.length - 1 ? 'text-slate-800' : ''}>{item.label}</span>
          {index < items.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </div>
  );
}
