import { mergeClassNames } from '@/utils/helpers';

export default function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  };

  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
