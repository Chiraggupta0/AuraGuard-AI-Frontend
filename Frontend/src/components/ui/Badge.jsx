import { mergeClassNames } from '@/utils/helpers';

export default function Badge({ className = '', tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-white/10 text-slate-200',
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-300',
    info: 'bg-auraguard-500/15 text-auraguard-200',
  };

  return <span className={mergeClassNames('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', tones[tone], className)}>{children}</span>;
}
