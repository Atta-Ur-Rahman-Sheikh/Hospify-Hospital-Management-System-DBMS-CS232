import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Skeleton from './Skeleton';
import { cn } from '../../lib/cn';

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  trend,
  hint,
  loading = false,
  className,
}) {
  const TONES = {
    brand:   'from-brand-500/20 via-brand-600/10 to-transparent text-brand-300',
    vital:   'from-vital-500/20 via-vital-600/10 to-transparent text-vital-300',
    warn:    'from-warn-500/20 via-warn-600/10 to-transparent text-warn-500',
    danger:  'from-danger-500/20 via-danger-600/10 to-transparent text-danger-500',
    indigo:  'from-indigo-500/20 via-indigo-600/10 to-transparent text-indigo-300',
    fuchsia: 'from-fuchsia-500/20 via-fuchsia-600/10 to-transparent text-fuchsia-300',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-ink-500/50 bg-ink-800/80',
        'shadow-[0_2px_4px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.25)]',
        'p-5',
        className
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', TONES[tone])} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-200">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <p className="mt-1.5 text-3xl font-bold text-white tracking-tight tabular-nums">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-xs text-ink-200">{hint}</p>
          )}
          {trend != null && !loading && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-vital-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-danger-500" />
              )}
              <span className={trend >= 0 ? 'text-vital-400' : 'text-danger-500'}>
                {Math.abs(trend)}%
              </span>
              <span className="text-ink-300 font-normal">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'h-11 w-11 rounded-xl ring-1 ring-inset flex items-center justify-center shrink-0',
            tone === 'brand'   && 'bg-brand-500/15 ring-brand-500/30',
            tone === 'vital'   && 'bg-vital-500/15 ring-vital-500/30',
            tone === 'warn'    && 'bg-warn-500/15 ring-warn-500/30',
            tone === 'danger'  && 'bg-danger-500/15 ring-danger-500/30',
            tone === 'indigo'  && 'bg-indigo-500/15 ring-indigo-500/30',
            tone === 'fuchsia' && 'bg-fuchsia-500/15 ring-fuchsia-500/30',
          )}>
            <Icon className={cn('h-5 w-5', TONES[tone].split(' ').pop())} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
