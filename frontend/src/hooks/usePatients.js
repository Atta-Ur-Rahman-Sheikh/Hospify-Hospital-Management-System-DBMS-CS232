import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const PATIENTS_QUERY_KEY = ['patients'];

export function usePatients() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data;
    },
  });
}

export function usePatient(id) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await api.get(`/patients/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/patients', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await api.put(`/patients/${id}`, data);
      return res.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['patient', vars.id] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/patients/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY }),
  });
}
