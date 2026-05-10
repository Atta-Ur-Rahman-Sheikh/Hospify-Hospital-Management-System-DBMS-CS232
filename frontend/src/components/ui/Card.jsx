import { cn } from '../../lib/cn';

export function Card({ children, className, hoverable = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-ink-800/80 backdrop-blur-sm rounded-xl border border-ink-500/50',
        'shadow-[0_2px_4px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.25)]',
        hoverable && 'transition-all duration-200 hover:border-ink-400/70 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-ink-500/40 flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold text-white tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-sm text-ink-200', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-ink-500/40 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
