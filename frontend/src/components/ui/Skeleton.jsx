import { cn } from '../../lib/cn';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton rounded-md', className)}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('rounded-xl bg-ink-800/80 border border-ink-500/40 p-5 space-y-4', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="rounded-xl bg-ink-800/60 border border-ink-500/40 overflow-hidden">
      <div className="grid border-b border-ink-500/40 px-5 py-3 gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid px-5 py-4 gap-4 border-b border-ink-500/20 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
