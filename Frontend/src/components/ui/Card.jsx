import { mergeClassNames } from '@/utils/helpers';

export default function Card({ className = '', children }) {
  return (
    <section
      className={mergeClassNames(
        'rounded-lg border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition-colors duration-200',
        'hover:border-slate-300 hover:bg-white',
        className,
      )}
    >
      {children}
    </section>
  );
}
