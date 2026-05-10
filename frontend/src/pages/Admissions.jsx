import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardPlus,
  BedDouble,
  Stethoscope,
  Clock,
  LogOut as DischargeIcon,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import {
  useAdmissions,
  useAdmitPatient,
  useDischargePatient,
} from '../hooks/useAdmissions';
import { usePatients } from '../hooks/usePatients';
import { useDoctors } from '../hooks/useDoctors';
import { useAvailableBeds } from '../hooks/useWards';
import { useToast } from '../components/ui/useToast';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardBody, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Input';

const CAN_ADMIT     = ['super_admin', 'receptionist', 'doctor'];
const CAN_DISCHARGE = ['super_admin', 'doctor', 'receptionist'];

const TYPE_TONE = {
  emergency: 'danger',
  general:   'info',
  icu:       'warning',
  surgery:   'brand',
};

function timeSince(date) {
  if (!date) return '—';
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function Admissions() {
  const { user } = useAuth();
  const canAdmit     = CAN_ADMIT.includes(user?.role);
  const canDischarge = CAN_DISCHARGE.includes(user?.role);

  const { data: admissions = [], isLoading, isError, refetch, isRefetching } =
    useAdmissions('active');

  const discharge = useDischargePatient();
  const toast = useToast();
  const [openAdmit, setOpenAdmit] = useState(false);

  const handleDischarge = async (id, name) => {
    if (!window.confirm(`Discharge ${name}? This will generate the final bill and free the bed.`)) return;
    try {
      await discharge.mutateAsync(id);
      toast.success('Patient discharged', name);
    } catch (err) {
      toast.error('Discharge failed', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Admissions"
        description="Inpatients currently under care."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className={isRefetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            {canAdmit && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenAdmit(true)}>
                New Admission
              </Button>
            )}
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={ClipboardPlus} title="Couldn't load admissions" />
      ) : admissions.length === 0 ? (
        <EmptyState
          icon={ClipboardPlus}
          title="No active admissions"
          description="When you admit a patient they'll appear here."
        />
      ) : (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          {admissions.map((adm, i) => (
            <motion.div
              key={adm.admission_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card hoverable>
                <CardHeader>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={adm.patient_name} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{adm.patient_name}</p>
                      <p className="text-xs text-ink-200">
                        Admitted {new Date(adm.admitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge tone={TYPE_TONE[adm.admission_type] || 'neutral'} size="sm">
                    {adm.admission_type}
                  </Badge>
                </CardHeader>
                <CardBody className="grid grid-cols-3 gap-4">
                  <Stat
                    icon={Stethoscope}
                    label="Doctor"
                    value={adm.doctor_name || '—'}
                  />
                  <Stat
                    icon={BedDouble}
                    label="Bed"
                    value={adm.bed_number ? `Ward ${adm.ward_id} · ${adm.bed_number}` : '—'}
                  />
                  <Stat
                    icon={Clock}
                    label="Length of stay"
                    value={timeSince(adm.admitted_at)}
                  />
                </CardBody>
                <CardFooter className="justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">Vitals</Button>
                    <Button size="sm" variant="ghost">Prescriptions</Button>
                  </div>
                  {canDischarge && (
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<DischargeIcon className="h-3.5 w-3.5" />}
                      onClick={() => handleDischarge(adm.admission_id, adm.patient_name)}
                      isLoading={discharge.isPending}
                    >
                      Discharge
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AdmitModal open={openAdmit} onClose={() => setOpenAdmit(false)} />
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1 text-sm text-white truncate">{value}</p>
    </div>
  );
}

function AdmitModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Admit a patient"
      description="Pick a patient, a bed, and the responsible doctor."
    >
      {open && <AdmitForm onClose={onClose} />}
    </Modal>
  );
}

function AdmitForm({ onClose }) {
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', bed_id: '', admission_type: 'general' });
  const [errors, setErrors] = useState({});
  const admit = useAdmitPatient();
  const toast = useToast();
  const { data: patients = [] } = usePatients();
  const { data: doctors = [] } = useDoctors();
  const { data: beds = [] } = useAvailableBeds();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.patient_id) errs.patient_id = 'Required';
    if (!form.doctor_id)  errs.doctor_id = 'Required';
    if (!form.bed_id)     errs.bed_id = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await admit.mutateAsync({
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        bed_id: Number(form.bed_id),
        admission_type: form.admission_type,
      });
      toast.success('Patient admitted');
      onClose();
    } catch (err) {
      toast.error('Admission failed', err.response?.data?.error || 'Unknown error');
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
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.patient_id} value={p.patient_id}>
              {p.full_name} {p.cnic && `· ${p.cnic}`}
            </option>
          ))}
        </Select>
        <Select
          label="Attending doctor"
          value={form.doctor_id}
          onChange={setField('doctor_id')}
          error={errors.doctor_id}
          required
        >
          <option value="">Select doctor</option>
          {doctors.map((d) => (
            <option key={d.doctor_id} value={d.doctor_id}>
              {d.full_name} {d.specialization && `· ${d.specialization}`}
            </option>
          ))}
        </Select>
        <Select
          label="Available bed"
          value={form.bed_id}
          onChange={setField('bed_id')}
          error={errors.bed_id}
          required
        >
          <option value="">Select bed</option>
          {beds.map((b) => (
            <option key={b.bed_id} value={b.bed_id}>
              {b.ward_name} · Bed {b.bed_number} ({b.bed_type})
            </option>
          ))}
        </Select>
        <Select
          label="Admission type"
          value={form.admission_type}
          onChange={setField('admission_type')}
        >
          <option value="general">General</option>
          <option value="emergency">Emergency</option>
          <option value="icu">ICU</option>
          <option value="surgery">Surgery</option>
        </Select>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/40">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            isLoading={admit.isPending}
            leftIcon={!admit.isPending ? <Plus className="h-4 w-4" /> : undefined}
          >
            Admit
          </Button>
        </div>
      </form>
  );
}
