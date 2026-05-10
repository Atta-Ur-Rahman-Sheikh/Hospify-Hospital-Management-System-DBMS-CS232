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
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { usePatients, useCreatePatient } from '../hooks/usePatients';
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

const CAN_CREATE = ['super_admin', 'receptionist'];

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Patients() {
  const { user } = useAuth();
  const canCreate = CAN_CREATE.includes(user?.role);
  const location = useLocation();

  const { data: patients = [], isLoading, isError, refetch, isRefetching } =
    usePatients();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDir, setSortDir] = useState('asc');
  // Top bar's "+ New Patient" deep-links here with state.openCreate.
  // Read it via lazy initializer so we never need a setState-in-effect.
  const [openCreate, setOpenCreate] = useState(
    () => Boolean(location.state?.openCreate && canCreate)
  );

  // Clear the navigation state without triggering a React state update,
  // so a refresh / back-button doesn't re-open the modal.
  useEffect(() => {
    if (location.state?.openCreate) {
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients
      .filter((p) => {
        if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
        if (!q) return true;
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.cnic?.toString().toLowerCase().includes(q) ||
          p.phone?.toString().toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * dir;
        }
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [patients, search, genderFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Search, filter, and manage every patient registered in the system."
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

      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, CNIC, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <div className="sm:w-48 relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-200" />
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
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
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
                <button onClick={() => toggleSort('full_name')} className="inline-flex items-center gap-1 hover:text-white">
                  Patient {sortIcon('full_name')}
                </button>
              </TH>
              <TH>
                <button onClick={() => toggleSort('age')} className="inline-flex items-center gap-1 hover:text-white">
                  Age {sortIcon('age')}
                </button>
              </TH>
              <TH>Gender</TH>
              <TH>Blood Type</TH>
              <TH>Contact</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((p) => {
              const age = p.age ?? ageFromDob(p.dob);
              return (
                <TR key={p.patient_id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{p.full_name}</p>
                        <p className="text-xs text-ink-200 font-mono">
                          PT-{String(p.patient_id).padStart(4, '0')}
                        </p>
                      </div>
                    </div>
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
                      <span className="text-ink-300">—</span>
                    )}
                  </TD>
                  <TD>
                    <div className="space-y-0.5">
                      <p className="text-sm text-ink-100 inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-ink-300" />
                        {p.phone || '—'}
                      </p>
                      <p className="text-xs text-ink-200 inline-flex items-center gap-1.5">
                        <IdCard className="h-3 w-3 text-ink-300" />
                        {p.cnic || '—'}
                      </p>
                    </div>
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost">View</Button>
                      <Button size="sm" variant="secondary">Edit</Button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {/* Create slide-over */}
      <CreatePatientSlideOver open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  );
}

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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/40">
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
