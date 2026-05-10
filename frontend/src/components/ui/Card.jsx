import { cn } from '../../lib/cn';

export function Card({ children, className, hoverable = false, raised = false, ...props }) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-ink-500/40 bg-ink-800/70 backdrop-blur-sm',
        'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-12px_rgba(0,0,0,0.4)]',
        raised && 'shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_4px_8px_rgba(0,0,0,0.25),0_24px_56px_-20px_rgba(0,0,0,0.5)]',
        hoverable && 'transition-all duration-200 hover:border-ink-400/60 hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_4px_8px_rgba(0,0,0,0.3),0_18px_40px_-18px_rgba(0,0,0,0.5)]',
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
        'px-6 py-4 border-b border-ink-500/30 flex items-center justify-between gap-4',
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
    <p className={cn('text-sm text-ink-300', className)} {...props}>
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
      className={cn('px-6 py-4 border-t border-ink-500/30 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
