import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  IdCard,
  Droplet,
  Users as UsersIcon,
  Filter,
  RefreshCw,
  Calendar,
  Eye,
  MapPin,
  HeartPulse,
  Clock as ClockIcon,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { usePatients, usePatient, useCreatePatient } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { useAdmissions } from '../hooks/useAdmissions';
import { useToast } from '../components/ui/useToast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input, { Select } from '../components/ui/Input';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { SlideOver } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/cn';

const CAN_CREATE = ['super_admin', 'receptionist'];

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function relativeDate(d) {
  if (!d) return null;
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Patients() {
  const { user } = useAuth();
  const canCreate = CAN_CREATE.includes(user?.role);
  const location = useLocation();

  const { data: patients = [], isLoading, isError, refetch, isRefetching } = usePatients();
  const { data: admissions = [] } = useAdmissions('active');
  const { data: appointments = [] } = useAppointments();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDir, setSortDir] = useState('asc');
  const [openCreate, setOpenCreate] = useState(
    () => Boolean(location.state?.openCreate && canCreate)
  );
  const [viewId, setViewId] = useState(null);

  // Clear `location.state` after the slide-over has consumed it, so a refresh
  // doesn't re-open it. Initial open state is set lazily above via useState.
  useEffect(() => {
    if (location.state?.openCreate) {
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state?.openCreate, location.pathname]);

  // ── Derive per-patient status & last-visit from real backend data ──
  // Status is "Admitted" if currently in active admissions, "Active" otherwise.
  // (We never invent data — these are joined from existing endpoints.)
  const enriched = useMemo(() => {
    const admittedIds = new Set((admissions || []).map((a) => a.patient_id));
    const lastVisitMap = new Map();
    for (const a of appointments || []) {
      if (a.patient_id == null || !a.scheduled_at) continue;
      const d = new Date(a.scheduled_at);
      if (Number.isNaN(d.getTime())) continue;
      const prev = lastVisitMap.get(a.patient_id);
      if (!prev || d > prev) lastVisitMap.set(a.patient_id, d);
    }
    return patients.map((p) => ({
      ...p,
      _status: admittedIds.has(p.patient_id) ? 'admitted' : 'active',
      _lastVisit: lastVisitMap.get(p.patient_id) || null,
    }));
  }, [patients, admissions, appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched
      .filter((p) => {
        if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
        if (statusFilter !== 'all' && p._status !== statusFilter) return false;
        if (!q) return true;
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.cnic?.toString().toLowerCase().includes(q) ||
          p.phone?.toString().toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        let av = a[sortKey];
        let bv = b[sortKey];
        if (sortKey === '_lastVisit') {
          av = a._lastVisit ? a._lastVisit.getTime() : 0;
          bv = b._lastVisit ? b._lastVisit.getTime() : 0;
        }
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * dir;
        }
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [enriched, search, genderFilter, statusFilter, sortKey, sortDir]);

  const counts = useMemo(() => ({
    total: enriched.length,
    admitted: enriched.filter((p) => p._status === 'admitted').length,
  }), [enriched]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === '_lastVisit' ? 'desc' : 'asc');
    }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Patients"
        description="Search, filter, and manage every patient registered in the system."
        icon={UsersIcon}
        meta={
          <>
            <Badge tone="brand" size="sm">{counts.total} total</Badge>
            {counts.admitted > 0 && (
              <Badge tone="warning" size="sm" dot>
                {counts.admitted} currently admitted
              </Badge>
            )}
          </>
        }
        actions={
          <>
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
                onClick={() => setOpenCreate(true)}
              >
                Add Patient
              </Button>
            )}
          </>
        }
      />

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, CNIC, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <div className="sm:w-44 relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
            <Select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="pl-10"
            >
              <option value="all">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="inline-flex rounded-lg border border-ink-500/40 bg-ink-800 p-1 self-start sm:self-auto">
            {[
              { id: 'all',      label: 'All' },
              { id: 'active',   label: 'Active' },
              { id: 'admitted', label: 'Admitted' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                  statusFilter === opt.id
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-ink-100 hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : isError ? (
        <EmptyState
          icon={UsersIcon}
          title="Couldn't load patients"
          description="There was a problem reaching the server. Try refreshing."
          action={<Button onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>Retry</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No patients match your search"
          description="Try changing your filters or clearing the search."
        />
      ) : (
        <Table>
          <THead>
            <TR hoverable={false}>
              <TH>
                <SortBtn label="Patient" active={sortKey === 'full_name'} onClick={() => toggleSort('full_name')}>
                  {sortIcon('full_name')}
                </SortBtn>
              </TH>
              <TH>
                <SortBtn label="Age" active={sortKey === 'age'} onClick={() => toggleSort('age')}>
                  {sortIcon('age')}
                </SortBtn>
              </TH>
              <TH>Gender</TH>
              <TH>Blood</TH>
              <TH>
                <SortBtn label="Last visit" active={sortKey === '_lastVisit'} onClick={() => toggleSort('_lastVisit')}>
                  {sortIcon('_lastVisit')}
                </SortBtn>
              </TH>
              <TH align="center">Status</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((p) => {
              const age = p.age ?? ageFromDob(p.dob);
              return (
                <TR key={p.patient_id}>
                  <TD>
                    <button
                      type="button"
                      onClick={() => setViewId(p.patient_id)}
                      className="group flex items-center gap-3 text-left"
                    >
                      <Avatar name={p.full_name} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate group-hover:text-brand-300 transition-colors">{p.full_name}</p>
                        <p className="text-xs text-ink-300 font-mono">
                          PT-{String(p.patient_id).padStart(4, '0')}
                          {p.phone && (
                            <span className="ml-1.5 text-ink-400">
                              · <Phone className="inline h-2.5 w-2.5" /> {p.phone}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  </TD>
                  <TD>
                    <span className="text-white tabular-nums">{age != null ? `${age}y` : '—'}</span>
                  </TD>
                  <TD className="capitalize text-ink-100">{p.gender || '—'}</TD>
                  <TD>
                    {p.blood_group ? (
                      <Badge tone="danger" size="sm">
                        <Droplet className="h-3 w-3" />
                        {p.blood_group}
                      </Badge>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </TD>
                  <TD>
                    {p._lastVisit ? (
                      <div>
                        <p className="text-sm text-white">{p._lastVisit.toLocaleDateString()}</p>
                        <p className="text-xs text-ink-300">{relativeDate(p._lastVisit)}</p>
                      </div>
                    ) : (
                      <span className="text-ink-400 text-sm">never</span>
                    )}
                  </TD>
                  <TD align="center">
                    <StatusBadge status={p._status} />
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setViewId(p.patient_id)}
                      >
                        View
                      </Button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <CreatePatientSlideOver open={openCreate} onClose={() => setOpenCreate(false)} />
      <PatientDetailSlideOver patientId={viewId} onClose={() => setViewId(null)} />
    </div>
  );
}

function SortBtn({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 hover:text-white transition-colors',
        active && 'text-white'
      )}
    >
      {label} {children}
    </button>
  );
}

function StatusBadge({ status }) {
  if (status === 'admitted') {
    return (
      <Badge tone="warning" size="sm" dot>
        Admitted
      </Badge>
    );
  }
  return (
    <Badge tone="success" size="sm" dot>
      Active
    </Badge>
  );
}

// ── Patient detail slide-over ─────────────────────────────────────────────

function PatientDetailSlideOver({ patientId, onClose }) {
  return (
    <SlideOver
      open={!!patientId}
      onClose={onClose}
      title="Patient details"
      description="Full record from the medical directory."
      width="max-w-xl"
    >
      {patientId && <PatientDetail key={patientId} patientId={patientId} />}
    </SlideOver>
  );
}

function PatientDetail({ patientId }) {
  const { data: patient, isLoading, isError } = usePatient(patientId);
  const { data: appts = [] } = useAppointments();

  const ownAppts = useMemo(
    () => (appts || [])
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)),
    [appts, patientId]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonHero />
      </div>
    );
  }

  if (isError || !patient) {
    return <EmptyState icon={UsersIcon} title="Couldn't load record" />;
  }

  const age = patient.age ?? ageFromDob(patient.dob);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl bg-ink-900/60 border border-ink-500/40 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={patient.full_name} size="xl" ring />
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-ink-300 uppercase tracking-widest">
              PT-{String(patient.patient_id).padStart(4, '0')}
            </p>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 truncate">
              {patient.full_name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {age != null && <Badge tone="neutral" size="sm">{age} years</Badge>}
              {patient.gender && <Badge tone="neutral" size="sm" className="capitalize">{patient.gender}</Badge>}
              {patient.blood_group && (
                <Badge tone="danger" size="sm">
                  <Droplet className="h-3 w-3" />
                  {patient.blood_group}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact + identifiers */}
      <DetailGrid>
        <DetailRow icon={IdCard} label="CNIC / National ID" value={patient.cnic} mono />
        <DetailRow icon={Phone} label="Phone" value={patient.phone} />
        <DetailRow icon={MapPin} label="Address" value={patient.address} />
        <DetailRow icon={HeartPulse} label="Emergency contact" value={patient.emergency_contact} />
        <DetailRow icon={Calendar} label="Date of birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : null} />
        <DetailRow icon={ClockIcon} label="Registered" value={patient.created_at ? new Date(patient.created_at).toLocaleString() : null} />
      </DetailGrid>

      {/* Visit history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Visit history</h3>
          <p className="text-xs text-ink-300">{ownAppts.length} record{ownAppts.length === 1 ? '' : 's'}</p>
        </div>
        {ownAppts.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments yet" description="This patient hasn't been scheduled." />
        ) : (
          <ul className="space-y-2">
            {ownAppts.slice(0, 8).map((a) => {
              const d = new Date(a.scheduled_at);
              return (
                <li
                  key={a.appointment_id}
                  className="rounded-lg border border-ink-500/30 bg-ink-900/60 px-3 py-2.5 flex items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-md bg-brand-500/10 ring-1 ring-brand-500/30 flex flex-col items-center justify-center text-brand-300 shrink-0">
                    <span className="text-[8px] uppercase tracking-widest leading-none mt-0.5">
                      {d.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.doctor_name}</p>
                    <p className="text-xs text-ink-300 truncate">
                      {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {a.reason && ` · ${a.reason}`}
                    </p>
                  </div>
                  <Badge
                    size="sm"
                    tone={
                      a.status === 'completed' ? 'success'
                      : a.status === 'cancelled' || a.status === 'no_show' ? 'danger'
                      : 'info'
                    }
                  >
                    {a.status?.replace('_', ' ')}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DetailGrid({ children }) {
  return <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</dl>;
}

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-ink-500/30 bg-ink-900/40 px-3 py-2.5 min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-ink-300 flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-sm text-white truncate',
          mono && 'font-mono'
        )}
      >
        {value || <span className="text-ink-400">—</span>}
      </dd>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="rounded-xl bg-ink-900/60 border border-ink-500/40 p-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/4 skeleton rounded" />
          <div className="h-5 w-2/3 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Create slide-over ─────────────────────────────────────────────────────

function CreatePatientSlideOver({ open, onClose }) {
  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Register new patient"
      description="Capture the essential details — you can complete the medical history later."
      width="max-w-lg"
    >
      {open && <CreatePatientForm onClose={onClose} />}
    </SlideOver>
  );
}

function CreatePatientForm({ onClose }) {
  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    gender: 'male',
    cnic: '',
    phone: '',
    blood_group: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const create = useCreatePatient();
  const toast = useToast();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (!form.dob) errs.dob = 'Required';
    if (!form.gender) errs.gender = 'Required';
    if (!form.cnic.trim()) errs.cnic = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      const payload = {
        full_name: form.full_name.trim(),
        dob: form.dob,
        gender: form.gender,
        cnic: form.cnic.trim(),
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.blood_group) payload.blood_group = form.blood_group;
      if (form.address.trim()) payload.address = form.address.trim();

      await create.mutateAsync(payload);
      toast.success('Patient registered', `${form.full_name} added to the directory`);
      onClose();
    } catch (err) {
      toast.error('Could not create patient', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input
        label="Full name"
        placeholder="John Doe"
        value={form.full_name}
        onChange={setField('full_name')}
        error={errors.full_name}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date of birth"
          type="date"
          value={form.dob}
          onChange={setField('dob')}
          error={errors.dob}
          required
        />
        <Select
          label="Gender"
          value={form.gender}
          onChange={setField('gender')}
          error={errors.gender}
          required
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <Input
        label="CNIC / National ID"
        placeholder="12345-1234567-1"
        value={form.cnic}
        onChange={setField('cnic')}
        error={errors.cnic}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Phone"
          placeholder="+92 ..."
          value={form.phone}
          onChange={setField('phone')}
        />
        <Select
          label="Blood group"
          value={form.blood_group}
          onChange={setField('blood_group')}
        >
          <option value="">—</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </Select>
      </div>
      <Input
        label="Address"
        placeholder="Street, City"
        value={form.address}
        onChange={setField('address')}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/30">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          isLoading={create.isPending}
          leftIcon={!create.isPending ? <Plus className="h-4 w-4" /> : undefined}
        >
          Create patient
        </Button>
      </div>
    </form>
  );
}
