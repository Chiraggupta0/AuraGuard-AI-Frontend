import { forwardRef } from 'react';
import { mergeClassNames } from '@/utils/helpers';

const Button = forwardRef(function Button(
  { className = '', variant = 'primary', size = 'md', as: Component = 'button', loading = false, ...props },
  ref,
) {
  const variants = {
    primary:
      'bg-auraguard-500 text-white hover:bg-auraguard-600 active:bg-auraguard-700 shadow-lg shadow-auraguard-500/20 hover:shadow-xl hover:shadow-auraguard-500/30',
    secondary:
      'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 hover:border-slate-400',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 border border-red-200',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <Component
      ref={ref}
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-auraguard-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            opacity="0.75"
          />
        </svg>
      ) : (
        props.children
      )}
    </Component>
  );
});

export default Button;
