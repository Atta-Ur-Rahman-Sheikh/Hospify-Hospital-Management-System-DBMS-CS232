import { cn } from '../../lib/cn';

export default function PageHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-200 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
