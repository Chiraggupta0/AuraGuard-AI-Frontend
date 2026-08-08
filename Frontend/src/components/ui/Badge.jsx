import { mergeClassNames } from '@/utils/helpers';

export default function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    success: 'bg-green-500/10 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/10 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    neutral: 'bg-slate-800/50 text-slate-300 border border-slate-700/50',
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
