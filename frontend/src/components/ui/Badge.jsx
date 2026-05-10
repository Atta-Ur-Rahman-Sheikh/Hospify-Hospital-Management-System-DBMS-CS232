import { cn } from '../../lib/cn';

const TONES = {
  neutral: 'bg-ink-700 text-ink-100 ring-ink-500/40',
  brand:   'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  success: 'bg-vital-500/15 text-vital-300 ring-vital-500/30',
  warning: 'bg-warn-500/15 text-warn-500 ring-warn-500/30',
  danger:  'bg-danger-500/15 text-danger-500 ring-danger-500/30',
  info:    'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', `bg-current`)} />}
      {children}
    </span>
  );
}
