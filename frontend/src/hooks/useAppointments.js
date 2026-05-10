import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const APPOINTMENTS_QUERY_KEY = ['appointments'];

export function useAppointments() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/doctors/appointments/all');
      return res.data;
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/doctors/appointments', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/doctors/appointments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY }),
  });
}
