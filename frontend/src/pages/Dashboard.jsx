import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  CalendarClock,
  Stethoscope,
  Wallet,
  ArrowRight,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  BedDouble,
  ClipboardPlus,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import StatCard from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton, { SkeletonText } from '../components/ui/Skeleton';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { useDoctors, useBusyDoctors } from '../hooks/useDoctors';
import { useBills } from '../hooks/useBilling';
import { useAdmissions } from '../hooks/useAdmissions';
import { useWards } from '../hooks/useWards';
import { useAlerts } from '../hooks/useAdmin';
import { useAuditLog } from '../hooks/useAdmin';
import { cn } from '../lib/cn';

const ALERT_ROLES = ['super_admin', 'nurse', 'pharmacist'];
const AUDIT_ROLES = ['super_admin'];
const BUSY_ROLES  = ['super_admin', 'doctor'];

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isThisMonth(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatCurrency(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function greetingFor(date) {
  const h = date.getHours();
  if (h < 5)  return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

const STATUS_TONE = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'danger',
  no_show:   'neutral',
};

export default function Dashboard() {
  const { user } = useAuth();

  const patientsQ     = usePatients();
  const appointmentsQ = useAppointments();
  const doctorsQ      = useDoctors();
  const billsQ        = useBills();
  const admissionsQ   = useAdmissions('active');
  const wardsQ        = useWards();
  const alertsQ       = useAlerts({ enabled: ALERT_ROLES.includes(user?.role) });
  const auditQ        = useAuditLog({ enabled: AUDIT_ROLES.includes(user?.role) });
  const busyQ         = useBusyDoctors({ enabled: BUSY_ROLES.includes(user?.role) });

  const today = useMemo(() => new Date(), []);

  const todaysAppointments = useMemo(() => {
    const list = appointmentsQ.data || [];
    return list
      .filter((a) => a.scheduled_at && isSameDay(new Date(a.scheduled_at), today))
      // hide cancelled / no-show from "today's schedule" — they're noise
      .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [appointmentsQ.data, today]);

  const onDutyDoctors = useMemo(() => {
    const list = doctorsQ.data || [];
    const todayName = today
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase()
      .slice(0, 3);
    const map = { sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday' };
    const long = map[todayName];
    return list.filter((d) => {
      if (!d.is_active) return false;
      const days = (d.available_days || '').toLowerCase();
      if (!days) return d.is_active;
      return days.includes(long) || days.includes(todayName);
    }).length;
  }, [doctorsQ.data, today]);

  const revenueThisMonth = useMemo(() => {
    const list = billsQ.data || [];
    return list
      .filter((b) => b.generated_at && isThisMonth(new Date(b.generated_at)))
      .reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
  }, [billsQ.data]);

  const occupancy = useMemo(() => {
    let total = 0, occupied = 0;
    (wardsQ.data || []).forEach((w) =>
      (w.beds || []).forEach((b) => { total++; if (b.status === 'occupied') occupied++; })
    );
    return { total, occupied, pct: total ? Math.round((occupied / total) * 100) : 0 };
  }, [wardsQ.data]);

  // Build 14-day appointments trend buckets, also expose lightweight series
  // for sparklines on the stat cards.
  const appointmentTrend = useMemo(() => {
    const list = appointmentsQ.data || [];
    const buckets = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, scheduled: 0, completed: 0, cancelled: 0 };
    }
    list.forEach((a) => {
      const key = a.scheduled_at?.slice(0, 10);
      if (key && buckets[key]) {
        if (a.status === 'completed') buckets[key].completed += 1;
        else if (a.status === 'cancelled' || a.status === 'no_show') buckets[key].cancelled += 1;
        else buckets[key].scheduled += 1;
      }
    });
    return Object.values(buckets).map((b) => ({
      ...b,
      label: new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      total: b.scheduled + b.completed + b.cancelled,
    }));
  }, [appointmentsQ.data]);

  const apptSpark = useMemo(() => appointmentTrend.map((b) => b.total), [appointmentTrend]);

  // 6-month revenue
  const revenueByMonth = useMemo(() => {
    const list = billsQ.data || [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        revenue: 0,
      });
    }
    list.forEach((b) => {
      if (!b.generated_at) return;
      const d = new Date(b.generated_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m.revenue += Number(b.paid_amount || 0);
    });
    return months;
  }, [billsQ.data]);

  const revenueSpark = useMemo(() => revenueByMonth.map((m) => m.revenue), [revenueByMonth]);

  // Patient growth sparkline by created_at over the last 14 days.
  const patientsSpark = useMemo(() => {
    const list = patientsQ.data || [];
    const counts = new Array(14).fill(0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 13);
    list.forEach((p) => {
      if (!p.created_at) return;
      const d = new Date(p.created_at);
      const idx = Math.floor((d - start) / 86_400_000);
      if (idx >= 0 && idx < counts.length) counts[idx]++;
    });
    const startTotal = list.length - counts.reduce((s, n) => s + n, 0);
    return counts.reduce((acc, n) => {
      const last = acc.length ? acc[acc.length - 1] : startTotal;
      acc.push(last + n);
      return acc;
    }, []);
  }, [patientsQ.data]);

  // Trend helpers (% change vs previous half-window).
  function pctChange(arr) {
    if (!arr || arr.length < 4) return null;
    const half = Math.floor(arr.length / 2);
    const a = arr.slice(0, half).reduce((s, n) => s + n, 0);
    const b = arr.slice(half).reduce((s, n) => s + n, 0);
    if (!a) return b > 0 ? 100 : null;
    return Math.round(((b - a) / a) * 100);
  }

  const apptTrendPct    = pctChange(apptSpark);
  const revenueTrendPct = pctChange(revenueSpark);

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <Hero
        user={user}
        today={today}
        appointmentsToday={todaysAppointments.length}
        admissions={admissionsQ.data?.length || 0}
        occupancyPct={occupancy.pct}
        alerts={alertsQ.data?.length || 0}
      />

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={patientsQ.data?.length ?? '—'}
          icon={Users}
          tone="brand"
          loading={patientsQ.isLoading}
          hint={`${admissionsQ.data?.length || 0} currently admitted`}
          spark={patientsSpark}
        />
        <StatCard
          label="Appointments Today"
          value={todaysAppointments.length}
          icon={CalendarClock}
          tone="indigo"
          loading={appointmentsQ.isLoading}
          hint={`${appointmentsQ.data?.length || 0} total in system`}
          trend={apptTrendPct}
          trendLabel="vs prior week"
          spark={apptSpark}
        />
        <StatCard
          label="Doctors On Duty"
          value={onDutyDoctors}
          icon={Stethoscope}
          tone="vital"
          loading={doctorsQ.isLoading}
          hint={`${doctorsQ.data?.length || 0} on staff`}
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(revenueThisMonth)}
          icon={Wallet}
          tone="fuchsia"
          loading={billsQ.isLoading}
          hint={`${(billsQ.data || []).filter(b => b.status !== 'paid').length} unpaid bills`}
          trend={revenueTrendPct}
          trendLabel="vs prior 3mo"
          spark={revenueSpark}
        />
      </div>

      {/* Chart + Today's appointments */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Appointments — last 14 days</CardTitle>
              <p className="text-xs text-ink-300 mt-0.5">
                Scheduled vs. completed vs. cancelled
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <Legend dot="bg-brand-400" label="Scheduled" />
              <Legend dot="bg-vital-400" label="Completed" />
              <Legend dot="bg-danger-500" label="Cancelled" />
            </div>
          </CardHeader>
          <CardBody className="p-0 sm:p-2">
            {appointmentsQ.isLoading ? (
              <div className="h-72 p-4">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-72 -ml-2 -mr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={appointmentTrend} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
                    <defs>
                      <linearGradient id="gScheduled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCancelled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                    <Tooltip cursor={{ stroke: '#2A3650', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="scheduled" stroke="#60a5fa" fill="url(#gScheduled)" strokeWidth={2} />
                    <Area type="monotone" dataKey="completed" stroke="#2dd4bf" fill="url(#gCompleted)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cancelled" stroke="#ef4444" fill="url(#gCancelled)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Today's schedule</CardTitle>
              <p className="text-xs text-ink-300 mt-0.5">
                {todaysAppointments.length} active appointment{todaysAppointments.length === 1 ? '' : 's'}
              </p>
            </div>
            <Link to="/appointments">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0 max-h-[320px] overflow-y-auto">
            {appointmentsQ.isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysAppointments.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="A clear day"
                description="No appointments scheduled for today."
                className="m-4"
              />
            ) : (
              <ul className="divide-y divide-ink-500/25">
                {todaysAppointments.slice(0, 8).map((a) => {
                  const time = new Date(a.scheduled_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <li
                      key={a.appointment_id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-ink-700/30 transition-colors"
                    >
                      <div className="flex flex-col items-center w-12 shrink-0">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-300">
                          {a.status === 'completed' ? 'Done' : 'At'}
                        </span>
                        <span className="text-sm font-bold text-white tabular-nums">
                          {time}
                        </span>
                      </div>
                      <Avatar name={a.patient_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {a.patient_name}
                        </p>
                        <p className="text-xs text-ink-300 truncate">
                          {a.doctor_name}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[a.status] || 'neutral'} size="sm">
                        {a.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Revenue + Activity + Operational mini-grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue — last 6 months</CardTitle>
              <p className="text-xs text-ink-300 mt-0.5">Paid bill amounts</p>
            </div>
            <Badge tone="success" size="sm">
              <TrendingUp className="h-3 w-3" />
              {formatCurrency(revenueThisMonth)} this month
            </Badge>
          </CardHeader>
          <CardBody className="p-0 sm:p-2">
            {billsQ.isLoading ? (
              <div className="h-64 p-4">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-64 -ml-2 -mr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMonth} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(37,99,235,0.08)' }}
                      formatter={(v) => formatCurrency(v)}
                    />
                    <Bar dataKey="revenue" fill="url(#gRev)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="text-xs text-ink-300 mt-0.5">
                {AUDIT_ROLES.includes(user?.role)
                  ? 'Latest changes across the system'
                  : 'Latest active alerts'}
              </p>
            </div>
            <Activity className="h-4 w-4 text-ink-300" />
          </CardHeader>
          <CardBody className="p-0 max-h-[290px] overflow-y-auto">
            {AUDIT_ROLES.includes(user?.role) ? (
              <AuditFeed query={auditQ} />
            ) : (
              <AlertsFeed query={alertsQ} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Operational mini-grid: doctor leaderboard + ward occupancy */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {BUSY_ROLES.includes(user?.role) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Doctor leaderboard</CardTitle>
                <p className="text-xs text-ink-300 mt-0.5">By active admissions right now</p>
              </div>
              <Link to="/doctors">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  All doctors
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              <DoctorLeaderboard query={busyQ} />
            </CardBody>
          </Card>
        )}

        <Card className={cn(BUSY_ROLES.includes(user?.role) ? '' : 'lg:col-span-3')}>
          <CardHeader>
            <div>
              <CardTitle>Ward occupancy</CardTitle>
              <p className="text-xs text-ink-300 mt-0.5">
                {occupancy.occupied} of {occupancy.total} beds in use
              </p>
            </div>
            <Link to="/beds">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Live grid
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            <WardOccupancy query={wardsQ} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Hero({ user, today, appointmentsToday, admissions, occupancyPct, alerts }) {
  const fmtDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const fmtTime = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="relative overflow-hidden">
      <div className="conic-accent absolute inset-0 -z-0 opacity-90" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 80% 50%, transparent, black 60%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 80% 50%, transparent, black 60%)',
        }}
      />
      <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-300 font-semibold">
            <span className="inline-flex h-2 w-2 rounded-full bg-vital-500 pulse-dot" />
            Live · {fmtDate} · {fmtTime}
          </div>
          <h1 className="mt-2 text-[28px] sm:text-[34px] font-bold text-white leading-tight tracking-tight">
            {greetingFor(today)},{' '}
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-vital-400 bg-clip-text text-transparent">
              {user?.full_name?.split(' ')[0] || 'there'}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-200 max-w-xl">
            Here's a quick read on the hospital today — appointments, admissions and bed pressure at a glance.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          <HeroPill icon={CalendarClock} label="Appointments" value={appointmentsToday} tone="brand" />
          <HeroPill icon={ClipboardPlus} label="Admissions" value={admissions} tone="vital" />
          <HeroPill icon={BedDouble} label="Occupancy" value={`${occupancyPct}%`} tone={occupancyPct > 80 ? 'danger' : 'indigo'} />
          <HeroPill icon={AlertTriangle} label="Open alerts" value={alerts} tone={alerts > 0 ? 'warn' : 'vital'} />
        </div>
      </div>
    </Card>
  );
}

function HeroPill({ icon: Icon, label, value, tone = 'brand' }) {
  const TONE = {
    brand:  'text-brand-300 bg-brand-500/10  ring-brand-500/25',
    vital:  'text-vital-300 bg-vital-500/10  ring-vital-500/25',
    indigo: 'text-indigo-300 bg-indigo-500/10 ring-indigo-500/25',
    warn:   'text-warn-500   bg-warn-500/10   ring-warn-500/25',
    danger: 'text-danger-500 bg-danger-500/10 ring-danger-500/25',
  };
  return (
    <div className={cn(
      'rounded-xl px-3 py-2.5 ring-1 ring-inset min-w-[120px]',
      TONE[tone]
    )}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold opacity-90">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-xl font-bold text-white tabular-nums leading-none">{value}</p>
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-200">
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      {label}
    </span>
  );
}

function AuditFeed({ query }) {
  if (query.isLoading) {
    return (
      <div className="p-4 space-y-3">
        <SkeletonText lines={5} />
      </div>
    );
  }
  const items = (query.data || []).slice(0, 8);
  if (!items.length) {
    return <EmptyState icon={Activity} title="Quiet day" description="No recent system activity yet." className="m-4" />;
  }
  return (
    <ul className="divide-y divide-ink-500/25">
      {items.map((log) => {
        const Icon = log.action_type === 'INSERT' ? CheckCircle2
                  : log.action_type === 'DELETE' ? XCircle
                  : Activity;
        const tone = log.action_type === 'INSERT' ? 'text-vital-400'
                  : log.action_type === 'DELETE' ? 'text-danger-500'
                  : 'text-brand-400';
        return (
          <li key={log.log_id} className="px-5 py-3 flex items-start gap-3">
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', tone)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                <span className="font-semibold">{log.user_name || `User #${log.user_id}`}</span>{' '}
                <span className="text-ink-300">{log.action_type?.toLowerCase()}</span>{' '}
                <span className="font-mono text-xs text-ink-100">{log.table_name}</span>
                {log.record_id && <span className="text-ink-400"> · #{log.record_id}</span>}
              </p>
              <p className="text-[11px] text-ink-400 mt-0.5">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AlertsFeed({ query }) {
  if (query.isLoading) {
    return (
      <div className="p-4 space-y-3">
        <SkeletonText lines={4} />
      </div>
    );
  }
  if (query.isError) {
    return <EmptyState icon={AlertTriangle} title="Alerts unavailable" description="You don't have access to system alerts." className="m-4" />;
  }
  const items = (query.data || []).slice(0, 8);
  if (!items.length) {
    return <EmptyState icon={CheckCircle2} title="All clear" description="No unresolved alerts right now." className="m-4" />;
  }
  return (
    <ul className="divide-y divide-ink-500/25">
      {items.map((a) => (
        <li key={a.alert_id} className="px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-warn-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">
              {a.alert_type?.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-white mt-0.5 line-clamp-2">{a.message}</p>
            {a.created_at && (
              <p className="text-[11px] text-ink-400 mt-0.5">
                {new Date(a.created_at).toLocaleString()}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function DoctorLeaderboard({ query }) {
  if (query.isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }
  const all = query.data || [];
  const items = all.slice(0, 5);
  const max = Math.max(1, ...items.map((d) => d.active_patients));

  if (!items.length) {
    return <EmptyState icon={Stethoscope} title="No doctor data yet" className="m-4" />;
  }

  return (
    <ul className="divide-y divide-ink-500/25">
      {items.map((d, i) => {
        const pct = Math.round((d.active_patients / max) * 100);
        return (
          <li key={d.doctor_id} className="px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-md bg-ink-700 ring-1 ring-ink-500/40 text-ink-100 text-xs font-bold flex items-center justify-center tabular-nums">
                #{i + 1}
              </span>
              <Avatar name={d.doctor_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{d.doctor_name}</p>
                <p className="text-xs text-ink-300 truncate">{d.specialization || 'General Medicine'}</p>
              </div>
              <Badge tone={d.active_patients > 0 ? 'brand' : 'neutral'} size="sm">
                {d.active_patients} active
              </Badge>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-ink-700/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-vital-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WardOccupancy({ query }) {
  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }
  const wards = (query.data || []).map((w) => {
    const beds = w.beds || [];
    const occupied = beds.filter((b) => b.status === 'occupied').length;
    const total = beds.length;
    const pct = total ? Math.round((occupied / total) * 100) : 0;
    return { ...w, occupied, total, pct };
  });

  if (!wards.length) {
    return <EmptyState icon={BedDouble} title="No wards yet" />;
  }

  return (
    <ul className="space-y-3.5">
      {wards.slice(0, 6).map((w) => (
        <li key={w.ward_id}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm text-white truncate">{w.ward_name}</p>
            <p className="text-[11px] text-ink-300 tabular-nums">
              {w.occupied}/{w.total}{' '}
              <span className={cn('font-semibold ml-1', w.pct > 85 ? 'text-danger-500' : w.pct > 65 ? 'text-warn-500' : 'text-vital-300')}>
                {w.pct}%
              </span>
            </p>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-ink-700/80 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                w.pct > 85 ? 'bg-danger-500'
                  : w.pct > 65 ? 'bg-warn-500'
                  : 'bg-gradient-to-r from-brand-500 to-vital-500'
              )}
              style={{ width: `${w.pct}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
