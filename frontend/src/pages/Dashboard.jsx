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
import { useDoctors } from '../hooks/useDoctors';
import { useBills } from '../hooks/useBilling';
import { useAdmissions } from '../hooks/useAdmissions';
import { useAlerts } from '../hooks/useAdmin';
import { useAuditLog } from '../hooks/useAdmin';
import { cn } from '../lib/cn';

const ALERT_ROLES = ['super_admin', 'nurse', 'pharmacist'];
const AUDIT_ROLES = ['super_admin'];

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
  const alertsQ       = useAlerts({ enabled: ALERT_ROLES.includes(user?.role) });
  const auditQ        = useAuditLog({ enabled: AUDIT_ROLES.includes(user?.role) }) ?? { data: [] };

  // ── Derived stats ──
  const today = useMemo(() => new Date(), []);

  const todaysAppointments = useMemo(() => {
    const list = appointmentsQ.data || [];
    return list
      .filter((a) => a.scheduled_at && isSameDay(new Date(a.scheduled_at), today))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [appointmentsQ.data, today]);

  const onDutyDoctors = useMemo(() => {
    const list = doctorsQ.data || [];
    const todayName = today
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase()
      .slice(0, 3); // mon,tue,wed...
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

  // 14-day appointments trend
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

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-ink-200">
            {today.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-vital-400 bg-clip-text text-transparent">
              {user?.full_name?.split(' ')[0] || 'there'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-ink-200">
            Here's what's happening across the hospital today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success" dot>System operational</Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={patientsQ.data?.length ?? '—'}
          icon={Users}
          tone="brand"
          loading={patientsQ.isLoading}
          hint={`${admissionsQ.data?.length || 0} currently admitted`}
        />
        <StatCard
          label="Appointments Today"
          value={todaysAppointments.length}
          icon={CalendarClock}
          tone="indigo"
          loading={appointmentsQ.isLoading}
          hint={`${appointmentsQ.data?.length || 0} total in system`}
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
        />
      </div>

      {/* Chart + Today's appointments */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Appointments — last 14 days</CardTitle>
              <p className="text-xs text-ink-200 mt-0.5">
                Live data from the appointments service
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-ink-100">
                <span className="h-2 w-2 rounded-full bg-brand-400" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5 text-ink-100">
                <span className="h-2 w-2 rounded-full bg-vital-400" /> Completed
              </span>
              <span className="flex items-center gap-1.5 text-ink-100">
                <span className="h-2 w-2 rounded-full bg-danger-500" /> Cancelled
              </span>
            </div>
          </CardHeader>
          <CardBody className="p-0 sm:p-2">
            {appointmentsQ.isLoading ? (
              <div className="h-72 p-4">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-72 -ml-4 -mr-2">
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
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
              <CardTitle>Today's Appointments</CardTitle>
              <p className="text-xs text-ink-200 mt-0.5">
                {todaysAppointments.length} scheduled
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
                title="No appointments today"
                description="Your schedule is clear."
                className="m-4"
              />
            ) : (
              <ul className="divide-y divide-ink-500/30">
                {todaysAppointments.slice(0, 8).map((a) => {
                  const time = new Date(a.scheduled_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <li
                      key={a.appointment_id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-ink-700/40 transition-colors"
                    >
                      <Avatar name={a.patient_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {a.patient_name}
                        </p>
                        <p className="text-xs text-ink-200 truncate">
                          {a.doctor_name} · {time}
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

      {/* Revenue + Activity */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue — last 6 months</CardTitle>
              <p className="text-xs text-ink-200 mt-0.5">Paid bill amounts</p>
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
              <div className="h-64 -ml-4 -mr-2">
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
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
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
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-xs text-ink-200 mt-0.5">
                {AUDIT_ROLES.includes(user?.role)
                  ? 'Latest changes across the system'
                  : 'Latest active alerts'}
              </p>
            </div>
            <Activity className="h-4 w-4 text-ink-200" />
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
    </div>
  );
}

// ── helpers ──

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
    <ul className="divide-y divide-ink-500/30">
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
                <span className="text-ink-200">{log.action_type?.toLowerCase()}</span>{' '}
                <span className="font-mono text-xs text-ink-100">{log.table_name}</span>
                {log.record_id && <span className="text-ink-300"> · #{log.record_id}</span>}
              </p>
              <p className="text-[11px] text-ink-300 mt-0.5">
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
    <ul className="divide-y divide-ink-500/30">
      {items.map((a) => (
        <li key={a.alert_id} className="px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-warn-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-200">
              {a.alert_type?.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-white mt-0.5 line-clamp-2">{a.message}</p>
            {a.created_at && (
              <p className="text-[11px] text-ink-300 mt-0.5">
                {new Date(a.created_at).toLocaleString()}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
