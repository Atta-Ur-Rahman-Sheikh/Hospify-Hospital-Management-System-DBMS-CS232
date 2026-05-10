import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Building2, Wrench, RefreshCw, Wifi } from 'lucide-react';
import { useWards, useBedsRealtimeSync } from '../hooks/useWards';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

const BED_TONE = {
  available:   'border-vital-500/40 bg-vital-500/10 text-vital-300 hover:bg-vital-500/15',
  occupied:    'border-danger-500/40 bg-danger-500/10 text-danger-500 hover:bg-danger-500/15',
  maintenance: 'border-warn-500/40 bg-warn-500/10 text-warn-500 hover:bg-warn-500/15',
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
        title="Bed Availability"
        description="Real-time bed status across every ward, synced with Firestore."
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

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total beds" value={totals.total} loading={isLoading} icon={BedDouble} tone="brand" />
        <SummaryCard label="Available"  value={totals.available} loading={isLoading} icon={BedDouble} tone="vital" />
        <SummaryCard label="Occupied"   value={totals.occupied} loading={isLoading} icon={BedDouble} tone="danger" />
        <SummaryCard label="Maintenance" value={totals.maintenance} loading={isLoading} icon={Wrench} tone="warn" />
      </div>

      {/* Occupancy bar */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Hospital occupancy</p>
              <p className="text-xs text-ink-200 mt-0.5">
                {totals.occupied} of {totals.total} beds in use
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="success" size="sm" dot>
                <Wifi className="h-3 w-3" /> Live
              </Badge>
              <p className="text-2xl font-bold text-white tabular-nums">{occupancyPct}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                occupancyPct > 85 ? 'bg-danger-500'
                  : occupancyPct > 65 ? 'bg-warn-500'
                  : 'bg-gradient-to-r from-brand-500 to-vital-500'
              )}
            />
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
                  <Skeleton key={j} className="h-20" />
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
          {wards.map((ward) => {
            const used = (ward.beds || []).filter(b => b.status === 'occupied').length;
            const total = (ward.beds || []).length;
            const pct = total ? Math.round((used / total) * 100) : 0;
            return (
              <Card key={ward.ward_id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-brand-300" />
                    </div>
                    <div>
                      <CardTitle>{ward.ward_name}</CardTitle>
                      <p className="text-xs text-ink-200 mt-0.5 capitalize">
                        Floor {ward.floor_number} · {ward.ward_type} ward
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-200">Occupancy</p>
                    <p className="text-base font-bold text-white tabular-nums">
                      {used} / {total} <span className="text-ink-300 text-xs font-normal">({pct}%)</span>
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  {(ward.beds || []).length === 0 ? (
                    <p className="text-sm text-ink-200 text-center py-4">No beds in this ward.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
                      {ward.beds.map((bed) => (
                        <motion.div
                          key={bed.bed_id}
                          whileHover={{ y: -2, scale: 1.03 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                          className={cn(
                            'flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer',
                            BED_TONE[bed.status] || 'border-ink-500/40 bg-ink-700 text-ink-100'
                          )}
                          title={`Bed ${bed.bed_number} — ${bed.status}`}
                        >
                          <BedDouble className="h-6 w-6 opacity-90" />
                          <span className="mt-1.5 font-bold text-sm tabular-nums">{bed.bed_number}</span>
                          <span className="mt-0.5 text-[9px] uppercase tracking-widest font-semibold opacity-80">
                            {bed.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, loading, icon: Icon, tone }) {
  const TONES = {
    brand:   'text-brand-300 bg-brand-500/15 ring-brand-500/30',
    vital:   'text-vital-300 bg-vital-500/15 ring-vital-500/30',
    danger:  'text-danger-500 bg-danger-500/15 ring-danger-500/30',
    warn:    'text-warn-500 bg-warn-500/15 ring-warn-500/30',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-200">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-14 mt-2" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">{value}</p>
          )}
        </div>
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center ring-1 ring-inset', TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
