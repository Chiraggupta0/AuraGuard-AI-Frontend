import { mergeClassNames } from '@/utils/helpers';

export default function Card({ className = '', children }) {
  return (
    <section
      className={mergeClassNames(
        'rounded-lg border border-slate-800 bg-slate-900/40 p-6 shadow-sm backdrop-blur-xl transition-colors duration-200',
        'hover:border-slate-700 hover:bg-slate-900/60',
        className,
      )}
    >
      {children}
    </section>
  );
}
