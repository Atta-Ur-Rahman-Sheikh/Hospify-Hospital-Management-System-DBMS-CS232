import { cn } from '../../lib/cn';

export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        'border border-dashed border-ink-500/60 rounded-xl bg-ink-800/40',
        className
      )}
    >
      {Icon && (
        <div className="h-12 w-12 rounded-xl bg-ink-700/60 ring-1 ring-ink-500/50 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-ink-100" />
        </div>
      )}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-ink-200 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
