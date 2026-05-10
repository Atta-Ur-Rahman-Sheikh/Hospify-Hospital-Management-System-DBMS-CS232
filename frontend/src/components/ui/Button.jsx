import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-sm shadow-brand-600/30',
  secondary:
    'bg-ink-700 text-ink-50 border border-ink-500 hover:bg-ink-600 hover:border-ink-400',
  ghost:
    'bg-transparent text-ink-100 hover:bg-ink-700 hover:text-white',
  outline:
    'bg-transparent border border-ink-500 text-ink-50 hover:bg-ink-700 hover:border-ink-400',
  danger:
    'bg-danger-600 text-white hover:bg-danger-500',
  success:
    'bg-vital-600 text-white hover:bg-vital-500',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    disabled = false,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon && <span className="flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex shrink-0">{rightIcon}</span>}
    </button>
  );
});

export default Button;
