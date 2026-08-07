import { mergeClassNames } from '@/utils/helpers';

export default function Card({ className = '', children }) {
  return <section className={mergeClassNames('rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl', className)}>{children}</section>;
}
