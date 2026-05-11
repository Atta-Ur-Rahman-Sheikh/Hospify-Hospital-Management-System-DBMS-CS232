import { cn } from '../../lib/cn';

export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
  icon: Icon,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/80">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-brand-300" strokeWidth={1.8} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-ink-300 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
