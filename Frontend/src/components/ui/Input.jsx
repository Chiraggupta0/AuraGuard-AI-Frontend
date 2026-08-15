import { forwardRef } from 'react';
import { mergeClassNames } from '@/utils/helpers';

const Input = forwardRef(function Input({ className = '', label, error, ...props }, ref) {
  return (
    <label className="block space-y-2">
      {label ? <span className="block text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        ref={ref}
        className={mergeClassNames(
          'w-full h-10 rounded-lg border bg-white px-3 py-2 text-slate-900 transition-all duration-200',
          'border-slate-300 placeholder:text-slate-400',
          'focus:border-auraguard-500 focus:ring-2 focus:ring-auraguard-500/20 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
          className,
        )}
        {...props}
      />
      {error ? <span className="block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});

export default Input;
