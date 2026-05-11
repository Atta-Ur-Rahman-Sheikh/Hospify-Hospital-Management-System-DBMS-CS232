import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BedDouble,
  Building2,
  Wrench,
  RefreshCw,
  Wifi,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { useWards, useBedsRealtimeSync } from '../hooks/useWards';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

const BED_TONE = {
  available:   'border-vital-500/40   bg-vital-500/10   text-vital-300   hover:bg-vital-500/15',
  occupied:    'border-danger-500/40  bg-danger-500/10  text-danger-500  hover:bg-danger-500/15',
  maintenance: 'border-warn-500/40    bg-warn-500/10    text-warn-500    hover:bg-warn-500/15',
};

export default function Beds() {
  const { data: wards = [], isLoading, isError, refetch, isRefetching } = useWards();
  useBedsRealtimeSync();

  const totals = useMemo(() => {
    let total = 0, occupied = 0, available = 0, maintenance = 0;
    wards.forEach((w) => {
      (w.beds || []).forEach((b) => {
        total++;
        if (b.status === 'occupied') occupied++;
        else if (b.status === 'available') available++;
        else if (b.status === 'maintenance') maintenance++;
      });
    });
    return { total, occupied, available, maintenance };
  }, [wards]);

  const occupancyPct = totals.total
    ? Math.round((totals.occupied / totals.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Capacity"
        icon={BedDouble}
        title="Bed availability"
        description="Real-time bed status across every ward, synced live with Firestore."
        meta={
          <>
            <Badge tone="success" size="sm" dot>
              <Wifi className="h-3 w-3" /> Live
            </Badge>
            <Badge tone="brand" size="sm">
              {totals.total} total beds
            </Badge>
          </>
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={isRefetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      />

      {/* Hero — global occupancy ring + state cards */}
      <Card className="relative overflow-hidden">
        <div className="conic-accent absolute inset-0 -z-0 opacity-90" />
        <CardBody className="relative grid gap-6 grid-cols-1 lg:grid-cols-[280px_1fr] items-center">
          <OccupancyRing pct={occupancyPct} occupied={totals.occupied} total={totals.total} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StateCard label="Available" value={totals.available} tone="vital" icon={BedDouble} hint="Ready to admit" loading={isLoading} />
            <StateCard label="Occupied" value={totals.occupied} tone="danger" icon={HeartPulse} hint="In use" loading={isLoading} />
            <StateCard label="Maintenance" value={totals.maintenance} tone="warn" icon={Wrench} hint="Service" loading={isLoading} />
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-3">
                {[...Array(10)].map((_, j) => (
                  <Skeleton key={j} className="h-24" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={BedDouble} title="Couldn't load wards" />
      ) : wards.length === 0 ? (
        <EmptyState icon={Building2} title="No wards configured" />
      ) : (
        <div className="space-y-6">
          {wards.map((ward) => (
            <WardCard key={ward.ward_id} ward={ward} />
          ))}
        </div>
      )}
    </div>
  );
}

function StateCard({ label, value, hint, tone, icon: Icon, loading }) {
  const TONES = {
    vital:  'text-vital-300 bg-vital-500/15  ring-vital-500/30',
    danger: 'text-danger-500 bg-danger-500/15 ring-danger-500/30',
    warn:   'text-warn-500   bg-warn-500/15   ring-warn-500/30',
  };
  return (
    <div className="rounded-xl bg-ink-800/60 border border-ink-500/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-300">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-12 mt-1.5" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">{value}</p>
          )}
          <p className="text-[11px] text-ink-300 mt-0.5">{hint}</p>
        </div>
        <div className={cn('h-9 w-9 rounded-xl ring-1 ring-inset flex items-center justify-center shrink-0', TONES[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function OccupancyRing({ pct, occupied, total }) {
  const r = 64;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  const tone = pct > 85 ? 'danger' : pct > 65 ? 'warn' : 'vital';
  const ringColor = tone === 'danger' ? '#ef4444' : tone === 'warn' ? '#f59e0b' : '#0D9488';
  const trackColor = '#1E293B';

  return (
    <div className="relative h-40 w-40 mx-auto">
      <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90">
        <circle cx="80" cy="80" r={r} stroke={trackColor} strokeWidth="14" fill="none" />
        <motion.circle
          cx="80" cy="80" r={r}
          stroke={ringColor}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${ringColor}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">
          Occupancy
        </span>
        <span className="text-[42px] font-bold text-white leading-none tabular-nums tracking-tight">
          {pct}<span className="text-base align-top">%</span>
        </span>
        <span className="mt-1 text-[11px] text-ink-300 tabular-nums">
          {occupied} / {total} beds
        </span>
      </div>
    </div>
  );
}

function WardCard({ ward }) {
  const beds = ward.beds || [];
  const used = beds.filter((b) => b.status === 'occupied').length;
  const total = beds.length;
  const pct = total ? Math.round((used / total) * 100) : 0;

  const ringTone = pct > 85 ? 'text-danger-500' : pct > 65 ? 'text-warn-500' : 'text-vital-300';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand-300" strokeWidth={1.8} />
          </div>
          <div>
            <CardTitle>{ward.ward_name}</CardTitle>
            <p className="text-xs text-ink-300 mt-0.5 capitalize">
              Floor {ward.floor_number} · {ward.ward_type} ward
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-300">Occupancy</p>
          <p className="text-base font-bold text-white tabular-nums">
            {used}/{total}{' '}
            <span className={cn('text-xs font-semibold ml-1', ringTone)}>{pct}%</span>
          </p>
        </div>
      </CardHeader>
      <CardBody>
        {total === 0 ? (
          <p className="text-sm text-ink-300 text-center py-6">No beds in this ward.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
            {beds.map((bed) => (
              <BedTile key={bed.bed_id} bed={bed} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function BedTile({ bed }) {
  const tone = BED_TONE[bed.status] || 'border-ink-500/40 bg-ink-700 text-ink-200';
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer overflow-hidden',
        tone
      )}
      title={`Bed ${bed.bed_number} — ${bed.status}${bed.bed_type ? ' · ' + bed.bed_type : ''}`}
    >
      {/* Status indicator dot top-right */}
      {bed.status === 'occupied' && (
        <span className="absolute top-1.5 right-1.5">
          <span className="absolute inset-0 rounded-full bg-danger-500/40 animate-ping" />
          <span className="relative block h-1.5 w-1.5 rounded-full bg-danger-500" />
        </span>
      )}
      {bed.status === 'available' && (
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-vital-500" />
      )}
      {bed.status === 'maintenance' && (
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-warn-500" />
      )}

      {bed.status === 'occupied' ? (
        <HeartPulse className="h-6 w-6" strokeWidth={1.7} />
      ) : bed.status === 'maintenance' ? (
        <Wrench className="h-6 w-6" strokeWidth={1.7} />
      ) : bed.status === 'available' ? (
        <Sparkles className="h-6 w-6" strokeWidth={1.7} />
      ) : (
        <BedDouble className="h-6 w-6" strokeWidth={1.7} />
      )}

      <span className="mt-1.5 font-bold text-sm tabular-nums">{bed.bed_number}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-widest font-semibold opacity-80">
        {bed.status}
      </span>
      {bed.bed_type && (
        <span className="mt-0.5 text-[8px] uppercase tracking-widest text-ink-300/80 font-medium">
          {bed.bed_type}
        </span>
      )}
    </motion.div>
  );
}
