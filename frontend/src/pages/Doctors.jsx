import { useMemo, useState } from 'react';
import {
  Stethoscope,
  Search,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
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

export default function Doctors() {
  const { user } = useAuth();
  const canSeeBusy = ['super_admin', 'doctor'].includes(user?.role);

  const { data: doctors = [], isLoading, isError, refetch, isRefetching } = useDoctors();
  const { data: busy = [], isLoading: loadingBusy } = useBusyDoctors({
    enabled: canSeeBusy,
  }) ?? { data: [] };

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
        title="Doctors"
        description="Browse the medical staff, their specializations, and active workloads."
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
              className="block w-full rounded-lg bg-ink-900 text-sm text-white border border-ink-500 px-3 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
              <p className="text-xs text-ink-200 mt-0.5">Ranked by active admissions</p>
            </div>
            <Badge tone="brand" size="sm">Live</Badge>
          </CardHeader>
          <CardBody className="p-0">
            {loadingBusy ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-ink-500/30">
                {(busy || []).slice(0, 5).map((b, i) => (
                  <li key={b.doctor_id} className="px-5 py-3 flex items-center gap-3">
                    <span className="h-6 w-6 rounded-md bg-ink-700 ring-1 ring-ink-500/40 text-ink-100 text-xs font-bold flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>
                    <Avatar name={b.doctor_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{b.doctor_name}</p>
                      <p className="text-xs text-ink-200 truncate">{b.specialization}</p>
                    </div>
                    <Badge tone={b.active_patients > 0 ? 'brand' : 'neutral'} size="sm">
                      {b.active_patients} active
                    </Badge>
                  </li>
                ))}
                {(!busy || busy.length === 0) && (
                  <li className="px-5 py-6 text-center text-sm text-ink-200">No data yet.</li>
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
            <Card key={d.doctor_id} hoverable className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={d.full_name} size="lg" ring />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{d.full_name}</p>
                    <p className="text-xs text-brand-300 truncate font-medium">
                      {d.specialization || 'General Medicine'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {d.is_active ? (
                        <Badge tone="success" size="sm" dot>Active</Badge>
                      ) : (
                        <Badge tone="neutral" size="sm" dot>Inactive</Badge>
                      )}
                      {busyById[d.doctor_id] != null && (
                        <Badge tone="info" size="sm">
                          {busyById[d.doctor_id]} patients
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <dl className="mt-4 space-y-2.5 text-sm">
                  {d.qualification && (
                    <div className="flex items-center gap-2.5 text-ink-100">
                      <GraduationCap className="h-4 w-4 text-ink-200 shrink-0" />
                      <span className="truncate">{d.qualification}</span>
                    </div>
                  )}
                  {d.email && (
                    <div className="flex items-center gap-2.5 text-ink-100">
                      <Mail className="h-4 w-4 text-ink-200 shrink-0" />
                      <span className="truncate">{d.email}</span>
                    </div>
                  )}
                  {d.phone && (
                    <div className="flex items-center gap-2.5 text-ink-100">
                      <Phone className="h-4 w-4 text-ink-200 shrink-0" />
                      <span className="truncate">{d.phone}</span>
                    </div>
                  )}
                  {d.available_days && (
                    <div className="flex items-center gap-2.5 text-ink-100">
                      <CalendarDays className="h-4 w-4 text-ink-200 shrink-0" />
                      <span className="truncate capitalize">{d.available_days}</span>
                    </div>
                  )}
                </dl>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
