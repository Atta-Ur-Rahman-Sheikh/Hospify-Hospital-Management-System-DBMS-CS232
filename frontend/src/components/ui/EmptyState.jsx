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
        'relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-14',
        'rounded-xl border border-ink-500/40 bg-ink-800/40',
        className
      )}
    >
      {/* decorative grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      {Icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-brand-500/10 blur-xl" />
          <div className="relative h-14 w-14 rounded-2xl bg-ink-700/80 ring-1 ring-ink-500/40 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <Icon className="h-6 w-6 text-ink-100" strokeWidth={1.6} />
          </div>
        </div>
      )}
      <h3 className="relative text-base font-semibold text-white tracking-tight">{title}</h3>
      {description && (
        <p className="relative mt-1.5 text-sm text-ink-300 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}
