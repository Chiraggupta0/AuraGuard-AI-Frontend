import { forwardRef } from 'react';
import { mergeClassNames } from '@/utils/helpers';

const Button = forwardRef(function Button(
  { className = '', variant = 'primary', size = 'md', as: Component = 'button', ...props },
  ref,
) {
  const variants = {
    primary: 'bg-auraguard-500 text-white hover:bg-auraguard-400',
    secondary: 'bg-white/10 text-slate-100 hover:bg-white/15',
    ghost: 'bg-transparent text-slate-200 hover:bg-white/5',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  };

  return (
    <Component
      ref={ref}
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-auraguard-400/60 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

export default Button;
