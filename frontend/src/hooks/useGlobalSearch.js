import { useMemo } from 'react';
import { usePatients } from './usePatients';
import { useDoctors } from './useDoctors';
import { useBills } from './useBilling';
import { useAppointments } from './useAppointments';

/**
 * Aggregate live results from patients, doctors, bills and appointments
 * for the global ⌘K search bar. All sources reuse their existing react-query
 * caches so this is essentially free once the user has visited any page.
 */
export function useGlobalSearch(query) {
  const { data: patients = [] } = usePatients();
  const { data: doctors  = [] } = useDoctors();
  const { data: bills    = [] } = useBills();
  const { data: appts    = [] } = useAppointments();

  const results = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    const out = [];

    for (const p of patients) {
      if (
        p.full_name?.toLowerCase().includes(q) ||
        String(p.cnic || '').toLowerCase().includes(q) ||
        String(p.phone || '').toLowerCase().includes(q) ||
        String(p.patient_id) === q
      ) {
        out.push({
          kind: 'patient',
          id: p.patient_id,
          title: p.full_name,
          subtitle: `${p.cnic || '—'}${p.phone ? ` · ${p.phone}` : ''}`,
          href: '/patients',
        });
        if (out.length > 12) break;
      }
    }

    for (const d of doctors) {
      if (
        d.full_name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'doctor',
          id: d.doctor_id,
          title: d.full_name,
          subtitle: d.specialization || 'General Medicine',
          href: '/doctors',
        });
        if (out.length > 18) break;
      }
    }

    for (const b of bills) {
      if (
        b.patient_name?.toLowerCase().includes(q) ||
        String(b.bill_id).includes(q) ||
        String(b.admission_id).includes(q)
      ) {
        out.push({
          kind: 'bill',
          id: b.bill_id,
          title: `INV-${String(b.bill_id).padStart(5, '0')}`,
          subtitle: `${b.patient_name} · ${b.status}`,
          href: '/billing',
        });
        if (out.length > 24) break;
      }
    }

    for (const a of appts) {
      if (
        a.patient_name?.toLowerCase().includes(q) ||
        a.doctor_name?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'appointment',
          id: a.appointment_id,
          title: a.patient_name,
          subtitle: `${a.doctor_name} · ${new Date(a.scheduled_at).toLocaleString()}`,
          href: '/appointments',
        });
        if (out.length > 30) break;
      }
    }

    return out;
  }, [query, patients, doctors, bills, appts]);

  return results;
}
