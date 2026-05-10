import { useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointmentStatus,
} from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useDoctors } from '../hooks/useDoctors';
import { useToast } from '../components/ui/useToast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Card, CardHeader, CardBody, CardTitle } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input, { Select, Textarea } from '../components/ui/Input';
import Skeleton, { SkeletonTable } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

const STATUS_TONE = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'danger',
  no_show:   'neutral',
};

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 08:00–19:00
const CAN_CREATE = ['super_admin', 'receptionist'];
const CAN_STATUS = ['super_admin', 'receptionist', 'doctor'];

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // make Monday the first day
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const canCreate = CAN_CREATE.includes(user?.role);
  const canStatus = CAN_STATUS.includes(user?.role);

  const [view, setView] = useState('week'); // 'week' | 'list'
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [createDefaults, setCreateDefaults] = useState(null);

  const { data: appointments = [], isLoading, isError, refetch, isRefetching } =
    useAppointments();

  const updateStatus = useUpdateAppointmentStatus();
  const toast = useToast();

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekAppointments = useMemo(() => {
    const last = addDays(weekStart, 7);
    return appointments
      .filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= weekStart && d < last;
      })
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [appointments, weekStart]);

  const handleStatus = async (id, status) => {
    if (!canStatus) return;
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error('Could not update', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Manage upcoming consultations across the hospital."
        actions={
          <>
            <div className="inline-flex items-center rounded-lg border border-ink-500/50 bg-ink-800 p-1">
              <button
                onClick={() => setView('week')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                  view === 'week'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-ink-100 hover:text-white'
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Week
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                  view === 'list'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-ink-100 hover:text-white'
                )}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
            </div>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw className={isRefetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                size="md"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateDefaults({})}
              >
                Schedule
              </Button>
            )}
          </>
        }
      />

      {view === 'week' ? (
        <WeekView
          isLoading={isLoading}
          isError={isError}
          days={days}
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          appointments={weekAppointments}
          canCreate={canCreate}
          canStatus={canStatus}
          onCreate={(date) => setCreateDefaults({ scheduled_at: date })}
          onStatus={handleStatus}
          updating={updateStatus.isPending}
        />
      ) : (
        <ListView
          isLoading={isLoading}
          isError={isError}
          appointments={appointments}
          canStatus={canStatus}
          onStatus={handleStatus}
        />
      )}

      <CreateAppointmentModal
        open={!!createDefaults}
        defaults={createDefaults || {}}
        onClose={() => setCreateDefaults(null)}
      />
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────

function WeekView({
  isLoading, isError, days, weekStart, setWeekStart,
  appointments, canCreate, canStatus, onCreate, onStatus, updating,
}) {
  const today = new Date();

  const aptByCell = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const d = new Date(a.scheduled_at);
      const key = `${d.toDateString()}::${d.getHours()}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-100 hover:bg-ink-700 hover:text-white transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-100 hover:bg-ink-700 hover:text-white transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="ml-1"
            >
              Today
            </Button>
          </div>
          <div>
            <CardTitle>
              {weekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}{' '}
              –{' '}
              {addDays(weekStart, 6).toLocaleDateString(undefined, {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </CardTitle>
            <p className="text-xs text-ink-200 mt-0.5">{appointments.length} appointments this week</p>
          </div>
        </div>
        {canCreate && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onCreate(null)}
          >
            New
          </Button>
        )}
      </CardHeader>

      <CardBody className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-[420px] w-full" />
          </div>
        ) : isError ? (
          <EmptyState icon={CalendarClock} title="Couldn't load appointments" className="m-4" />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] sticky top-0 z-10 border-b border-ink-500/40 bg-ink-900/80 backdrop-blur">
                <div className="px-3 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-300">
                  Hour
                </div>
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      'px-3 py-3 text-center border-l border-ink-500/30',
                      sameDay(d, today) && 'bg-brand-600/10'
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </p>
                    <p className={cn(
                      'mt-0.5 text-lg font-bold tabular-nums',
                      sameDay(d, today) ? 'text-brand-400' : 'text-white'
                    )}>
                      {d.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Body */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-ink-500/20"
                >
                  <div className="px-3 py-3 text-[11px] font-medium text-ink-200 tabular-nums">
                    {String(h).padStart(2, '0')}:00
                  </div>
                  {days.map((d) => {
                    const cellDate = new Date(d);
                    cellDate.setHours(h, 0, 0, 0);
                    const items = aptByCell[`${d.toDateString()}::${h}`] || [];
                    return (
                      <button
                        key={d.toISOString() + h}
                        type="button"
                        onClick={() => canCreate && onCreate(cellDate.toISOString())}
                        className={cn(
                          'relative min-h-[60px] border-l border-ink-500/20 p-1.5 text-left transition-colors',
                          'hover:bg-brand-600/10',
                          sameDay(d, today) && 'bg-brand-600/[0.04]'
                        )}
                      >
                        {items.length === 0 && canCreate && (
                          <span className="opacity-0 hover:opacity-100 text-[10px] text-brand-300 inline-flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Add
                          </span>
                        )}
                        <div className="space-y-1">
                          {items.map((a) => (
                            <div
                              key={a.appointment_id}
                              onClick={(e) => { e.stopPropagation(); }}
                              className={cn(
                                'group rounded-md px-2 py-1.5 text-[11px] cursor-default ring-1 ring-inset',
                                a.status === 'completed' && 'bg-vital-500/15 ring-vital-500/30 text-vital-300',
                                a.status === 'cancelled' && 'bg-danger-500/15 ring-danger-500/30 text-danger-500 line-through',
                                a.status === 'no_show'   && 'bg-ink-700 ring-ink-500/40 text-ink-200',
                                (!a.status || a.status === 'scheduled') && 'bg-brand-600/15 ring-brand-500/30 text-brand-200',
                              )}
                              title={`${a.patient_name} — ${a.doctor_name}`}
                            >
                              <p className="font-semibold truncate">{a.patient_name}</p>
                              <p className="opacity-80 truncate">{new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {a.doctor_name}</p>
                              {canStatus && a.status === 'scheduled' && (
                                <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    disabled={updating}
                                    onClick={() => onStatus(a.appointment_id, 'completed')}
                                    className="text-[10px] text-vital-300 hover:text-vital-200"
                                  >
                                    ✓ Complete
                                  </button>
                                  <span className="text-ink-300">·</span>
                                  <button
                                    disabled={updating}
                                    onClick={() => onStatus(a.appointment_id, 'cancelled')}
                                    className="text-[10px] text-danger-500 hover:text-danger-400"
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── List View ─────────────────────────────────────────────────────────────

function ListView({ isLoading, isError, appointments, canStatus, onStatus }) {
  if (isLoading) return <SkeletonTable rows={8} cols={6} />;
  if (isError) {
    return <EmptyState icon={CalendarClock} title="Couldn't load appointments" />;
  }
  if (appointments.length === 0) {
    return <EmptyState icon={CalendarClock} title="No appointments yet" description="Click Schedule to add the first one." />;
  }
  return (
    <Table>
      <THead>
        <TR hoverable={false}>
          <TH>When</TH>
          <TH>Patient</TH>
          <TH>Doctor</TH>
          <TH>Reason</TH>
          <TH align="center">Status</TH>
          <TH align="right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {appointments.map((a) => {
          const d = new Date(a.scheduled_at);
          return (
            <TR key={a.appointment_id}>
              <TD>
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30 flex flex-col items-center justify-center text-brand-300">
                    <span className="text-[8px] uppercase tracking-widest leading-none mt-1">
                      {d.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm text-white tabular-nums">
                      {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-ink-200">
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </p>
                  </div>
                </div>
              </TD>
              <TD>
                <div className="flex items-center gap-2.5">
                  <Avatar name={a.patient_name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{a.patient_name}</p>
                    {a.patient_phone && (
                      <p className="text-xs text-ink-200">{a.patient_phone}</p>
                    )}
                  </div>
                </div>
              </TD>
              <TD>
                <p className="text-sm text-ink-100">{a.doctor_name}</p>
              </TD>
              <TD>
                <p className="text-sm text-ink-100 max-w-[260px] truncate" title={a.reason}>
                  {a.reason || '—'}
                </p>
              </TD>
              <TD align="center">
                <Badge tone={STATUS_TONE[a.status] || 'neutral'} size="sm">
                  {a.status?.replace('_', ' ')}
                </Badge>
              </TD>
              <TD align="right">
                <div className="flex items-center justify-end gap-1.5">
                  {canStatus && a.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onClick={() => onStatus(a.appointment_id, 'completed')}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<XCircle className="h-3.5 w-3.5" />}
                        onClick={() => onStatus(a.appointment_id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────

function CreateAppointmentModal({ open, defaults, onClose }) {
  // Use a key based on the requested time so when the user clicks a
  // different empty cell, the inner form remounts with fresh defaults.
  const formKey = defaults?.scheduled_at || 'manual';
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule appointment"
      description="Pick a patient, doctor, and time."
      size="md"
    >
      {open && (
        <CreateAppointmentForm key={formKey} defaults={defaults} onClose={onClose} />
      )}
    </Modal>
  );
}

function CreateAppointmentForm({ defaults, onClose }) {
  const [form, setForm] = useState(() => ({
    patient_id: '',
    doctor_id: '',
    scheduled_at: defaults?.scheduled_at ? toLocalInputDate(defaults.scheduled_at) : '',
    reason: '',
  }));
  const [errors, setErrors] = useState({});
  const create = useCreateAppointment();
  const toast = useToast();
  const { data: patients = [], isLoading: loadingP } = usePatients();
  const { data: doctors = [],  isLoading: loadingD } = useDoctors();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.patient_id) errs.patient_id = 'Required';
    if (!form.doctor_id) errs.doctor_id = 'Required';
    if (!form.scheduled_at) errs.scheduled_at = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      const payload = {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      };
      if (form.reason.trim()) payload.reason = form.reason.trim();
      await create.mutateAsync(payload);
      toast.success('Appointment scheduled');
      onClose();
    } catch (err) {
      toast.error('Could not schedule', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
        <Select
          label="Patient"
          value={form.patient_id}
          onChange={setField('patient_id')}
          error={errors.patient_id}
          required
        >
          <option value="">{loadingP ? 'Loading patients…' : 'Select patient'}</option>
          {patients.map((p) => (
            <option key={p.patient_id} value={p.patient_id}>
              {p.full_name} {p.cnic && `· ${p.cnic}`}
            </option>
          ))}
        </Select>
        <Select
          label="Doctor"
          value={form.doctor_id}
          onChange={setField('doctor_id')}
          error={errors.doctor_id}
          required
        >
          <option value="">{loadingD ? 'Loading doctors…' : 'Select doctor'}</option>
          {doctors.map((d) => (
            <option key={d.doctor_id} value={d.doctor_id}>
              {d.full_name} {d.specialization && `· ${d.specialization}`}
            </option>
          ))}
        </Select>
        <Input
          label="Date & time"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={setField('scheduled_at')}
          error={errors.scheduled_at}
          leftIcon={<Clock className="h-4 w-4" />}
          required
        />
        <Textarea
          label="Reason (optional)"
          rows={3}
          value={form.reason}
          onChange={setField('reason')}
          placeholder="Brief context for the visit…"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/40">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            isLoading={create.isPending}
            leftIcon={!create.isPending ? <Plus className="h-4 w-4" /> : undefined}
          >
            Schedule
          </Button>
        </div>
    </form>
  );
}

function toLocalInputDate(isoOrDate) {
  const d = new Date(isoOrDate);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
