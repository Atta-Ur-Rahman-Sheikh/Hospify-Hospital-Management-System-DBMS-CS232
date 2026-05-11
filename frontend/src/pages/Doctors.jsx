import { useMemo, useState } from 'react';
import {
  Stethoscope,
  Search,
  Mail,
  Phone,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { useDoctors, useBusyDoctors } from '../hooks/useDoctors';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/auth-context';
import { cn } from '../lib/cn';

// Per-doctor color identity, derived from the doctor name. Stable across
// renders so each doctor "owns" their tile color in the directory.
const DOCTOR_PALETTES = [
  { from: 'from-brand-500/30', to: 'to-brand-700/30',  text: 'text-brand-300',  ring: 'ring-brand-500/30',  bar: 'bg-brand-500'  },
  { from: 'from-vital-500/30', to: 'to-vital-700/30',  text: 'text-vital-300',  ring: 'ring-vital-500/30',  bar: 'bg-vital-500'  },
  { from: 'from-fuchsia-500/30', to: 'to-fuchsia-700/30', text: 'text-fuchsia-300', ring: 'ring-fuchsia-500/30', bar: 'bg-fuchsia-500' },
  { from: 'from-amber-500/30', to: 'to-amber-700/30',  text: 'text-amber-300',  ring: 'ring-amber-500/30',  bar: 'bg-amber-500'  },
  { from: 'from-rose-500/30',  to: 'to-rose-700/30',   text: 'text-rose-300',   ring: 'ring-rose-500/30',   bar: 'bg-rose-500'   },
  { from: 'from-indigo-500/30', to: 'to-indigo-700/30', text: 'text-indigo-300', ring: 'ring-indigo-500/30', bar: 'bg-indigo-500' },
  { from: 'from-cyan-500/30',  to: 'to-cyan-700/30',   text: 'text-cyan-300',   ring: 'ring-cyan-500/30',   bar: 'bg-cyan-500'   },
];

function paletteFor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return DOCTOR_PALETTES[h % DOCTOR_PALETTES.length];
}

const ALL_DAYS = [
  { key: 'mon', label: 'Mon', match: ['mon', 'monday'] },
  { key: 'tue', label: 'Tue', match: ['tue', 'tuesday'] },
  { key: 'wed', label: 'Wed', match: ['wed', 'wednesday'] },
  { key: 'thu', label: 'Thu', match: ['thu', 'thursday'] },
  { key: 'fri', label: 'Fri', match: ['fri', 'friday'] },
  { key: 'sat', label: 'Sat', match: ['sat', 'saturday'] },
  { key: 'sun', label: 'Sun', match: ['sun', 'sunday'] },
];

function parseAvailableDays(str) {
  if (!str) return new Set();
  const lower = str.toLowerCase();
  const set = new Set();
  for (const d of ALL_DAYS) {
    if (d.match.some((m) => lower.includes(m))) set.add(d.key);
  }
  return set;
}

export default function Doctors() {
  const { user } = useAuth();
  const canSeeBusy = ['super_admin', 'doctor'].includes(user?.role);

  const { data: doctors = [], isLoading, isError, refetch, isRefetching } = useDoctors();
  const { data: busy = [], isLoading: loadingBusy } = useBusyDoctors({
    enabled: canSeeBusy,
  });

  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('all');

  const specializations = useMemo(() => {
    const s = new Set();
    (doctors || []).forEach((d) => d.specialization && s.add(d.specialization));
    return ['all', ...Array.from(s).sort()];
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (doctors || []).filter((d) => {
      if (specFilter !== 'all' && d.specialization !== specFilter) return false;
      if (!q) return true;
      return (
        d.full_name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
      );
    });
  }, [doctors, search, specFilter]);

  const busyById = useMemo(() => {
    const map = {};
    (busy || []).forEach((b) => { map[b.doctor_id] = b.active_patients; });
    return map;
  }, [busy]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care team"
        icon={Stethoscope}
        title="Doctors"
        description="Browse the medical staff, their specializations, and active workloads."
        meta={
          <>
            <Badge tone="brand" size="sm">{(doctors || []).length} on staff</Badge>
            <Badge tone="success" size="sm">{(doctors || []).filter((d) => d.is_active).length} active</Badge>
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

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, specialization, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <div className="sm:w-56">
            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="block w-full rounded-lg bg-ink-900 text-sm text-white border border-ink-500/40 px-3 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {specializations.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All specializations' : s}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Busy doctors leaderboard */}
      {canSeeBusy && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Most active doctors</CardTitle>
              <p className="text-xs text-ink-300 mt-0.5">Ranked by active admissions</p>
            </div>
            <Badge tone="brand" size="sm" dot>Live</Badge>
          </CardHeader>
          <CardBody className="p-0">
            {loadingBusy ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-ink-500/25">
                {(busy || []).slice(0, 5).map((b, i) => {
                  const palette = paletteFor(b.doctor_name);
                  const max = Math.max(1, ...((busy || []).map(x => x.active_patients)));
                  const pct = Math.round((b.active_patients / max) * 100);
                  return (
                    <li key={b.doctor_id} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-md bg-ink-700 ring-1 ring-ink-500/40 text-ink-100 text-xs font-bold flex items-center justify-center tabular-nums">
                          #{i + 1}
                        </span>
                        <Avatar name={b.doctor_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{b.doctor_name}</p>
                          <p className={cn('text-xs truncate', palette.text)}>{b.specialization || 'General Medicine'}</p>
                        </div>
                        <Badge tone={b.active_patients > 0 ? 'brand' : 'neutral'} size="sm">
                          {b.active_patients} active
                        </Badge>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-ink-700/80 overflow-hidden">
                        <div className={cn('h-full rounded-full', palette.bar)} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
                {(!busy || busy.length === 0) && (
                  <li className="px-5 py-6 text-center text-sm text-ink-300">No data yet.</li>
                )}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {/* Doctor cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={Stethoscope} title="Couldn't load doctors" description="Try refreshing the page." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" description="Try clearing your filters." />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <DoctorCard key={d.doctor_id} doctor={d} activePatients={busyById[d.doctor_id]} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorCard({ doctor: d, activePatients }) {
  const palette = paletteFor(d.full_name);
  const days = parseAvailableDays(d.available_days);
  const todayKey = ALL_DAYS[((new Date().getDay() + 6) % 7)].key;

  return (
    <Card hoverable className="overflow-hidden group">
      {/* Per-doctor gradient header strip */}
      <div className={cn('relative h-16 bg-gradient-to-br', palette.from, palette.to)}>
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div className={cn('absolute left-0 top-0 h-full w-1', palette.bar)} />
      </div>

      <div className="px-5 pb-5 -mt-9 relative">
        <div className="flex items-end gap-3">
          <Avatar name={d.full_name} size="lg" ring className="!ring-4 !ring-ink-800" />
          <div className="flex-1 min-w-0 pb-1">
            <p className="font-semibold text-white truncate leading-tight">{d.full_name}</p>
            <p className={cn('text-xs truncate font-medium', palette.text)}>
              {d.specialization || 'General Medicine'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {d.is_active ? (
            <Badge tone="success" size="sm" dot>Active</Badge>
          ) : (
            <Badge tone="neutral" size="sm" dot>Inactive</Badge>
          )}
          {activePatients != null && (
            <Badge tone="info" size="sm">
              {activePatients} active patient{activePatients === 1 ? '' : 's'}
            </Badge>
          )}
        </div>

        {/* Available days pills */}
        {days.size > 0 && (
          <div className="mt-3.5">
            <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold mb-1.5">
              Available
            </p>
            <div className="flex items-center gap-1">
              {ALL_DAYS.map((day) => {
                const on = days.has(day.key);
                const isToday = day.key === todayKey;
                return (
                  <span
                    key={day.key}
                    title={day.label + (on ? ' · available' : ' · off')}
                    className={cn(
                      'flex-1 text-center text-[10px] font-semibold py-1 rounded ring-1 ring-inset transition-colors',
                      on
                        ? cn('bg-ink-900/40', palette.text, palette.ring)
                        : 'bg-ink-700/30 text-ink-500 ring-ink-500/20',
                      isToday && on && 'shadow-[inset_0_-2px_0_currentColor]',
                    )}
                  >
                    {day.label[0]}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <dl className="mt-4 space-y-2 text-sm">
          {d.qualification && (
            <div className="flex items-center gap-2 text-ink-100">
              <GraduationCap className="h-3.5 w-3.5 text-ink-300 shrink-0" />
              <span className="truncate">{d.qualification}</span>
            </div>
          )}
          {d.email && (
            <div className="flex items-center gap-2 text-ink-200">
              <Mail className="h-3.5 w-3.5 text-ink-300 shrink-0" />
              <span className="truncate text-xs">{d.email}</span>
            </div>
          )}
          {d.phone && (
            <div className="flex items-center gap-2 text-ink-200">
              <Phone className="h-3.5 w-3.5 text-ink-300 shrink-0" />
              <span className="truncate text-xs">{d.phone}</span>
            </div>
          )}
        </dl>
      </div>
    </Card>
  );
}
