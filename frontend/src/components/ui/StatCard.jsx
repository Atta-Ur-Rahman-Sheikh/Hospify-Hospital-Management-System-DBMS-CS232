import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Skeleton from './Skeleton';
import Sparkline from './Sparkline';
import { cn } from '../../lib/cn';

const TONES = {
  brand:   { glow: 'rgba(37, 99, 235, 0.35)',  ring: 'ring-brand-500/30  bg-brand-500/15  text-brand-300',  spark: '#60a5fa' },
  vital:   { glow: 'rgba(13, 148, 136, 0.35)', ring: 'ring-vital-500/30  bg-vital-500/15  text-vital-300',  spark: '#2dd4bf' },
  warn:    { glow: 'rgba(217, 119, 6, 0.35)',  ring: 'ring-warn-500/30   bg-warn-500/15   text-warn-500',   spark: '#f59e0b' },
  danger:  { glow: 'rgba(220, 38, 38, 0.35)',  ring: 'ring-danger-500/30 bg-danger-500/15 text-danger-500', spark: '#ef4444' },
  indigo:  { glow: 'rgba(99, 102, 241, 0.35)', ring: 'ring-indigo-500/30 bg-indigo-500/15 text-indigo-300', spark: '#818cf8' },
  fuchsia: { glow: 'rgba(217, 70, 239, 0.35)', ring: 'ring-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300', spark: '#e879f9' },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  trend,
  trendLabel = 'vs last period',
  hint,
  spark,
  loading = false,
  className,
}) {
  const t = TONES[tone] || TONES.brand;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-ink-500/40 bg-ink-800/70 backdrop-blur-sm',
        'shadow-[0_2px_4px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.18)]',
        'p-5 transition-shadow duration-300',
        className
      )}
      style={{
        // a soft tinted glow that strengthens on hover
        boxShadow: `0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 60px -28px ${t.glow}`,
      }}
    >
      {/* corner accent gradient */}
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-25 group-hover:opacity-40 transition-opacity"
        style={{ background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-9 w-24 mt-2.5" />
          ) : (
            <p className="mt-1.5 text-[26px] sm:text-3xl font-bold text-white tracking-tight tabular-nums leading-none">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1.5 text-xs text-ink-300">{hint}</p>
          )}
          {trend != null && !loading && (
            <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-vital-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-danger-500" />
              )}
              <span className={trend >= 0 ? 'text-vital-400' : 'text-danger-500'}>
                {Math.abs(trend)}%
              </span>
              <span className="text-ink-300 font-normal">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          {Icon && (
            <div className={cn('h-10 w-10 rounded-xl ring-1 ring-inset flex items-center justify-center', t.ring)}>
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
          )}
          {spark && spark.length > 1 && !loading && (
            <Sparkline
              data={spark}
              color={t.spark}
              width={88}
              height={28}
              fillOpacity={0.18}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
