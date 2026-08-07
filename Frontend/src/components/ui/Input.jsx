import { forwardRef } from 'react';
import { mergeClassNames } from '@/utils/helpers';

const Input = forwardRef(function Input({ className = '', label, error, ...props }, ref) {
  return (
    <label className="grid gap-1 text-sm text-slate-200">
      {label ? <span>{label}</span> : null}
      <input
        ref={ref}
        className={mergeClassNames(
          'h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-auraguard-400/60 focus:ring-2 focus:ring-auraguard-400/20',
          error && 'border-red-400/60 focus:border-red-400/60 focus:ring-red-400/20',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
});

export default Input;
