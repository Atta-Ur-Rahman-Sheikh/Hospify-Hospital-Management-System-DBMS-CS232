import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const ADMISSIONS_QUERY_KEY = ['admissions'];

export function useAdmissions(status) {
  return useQuery({
    queryKey: [...ADMISSIONS_QUERY_KEY, status || 'active'],
    queryFn: async () => {
      const params = status ? { status } : {};
      const res = await api.get('/admissions', { params });
      return res.data;
    },
  });
}

export function useDischargePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (admissionId) => {
      const res = await api.post(`/admissions/${admissionId}/discharge`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMISSIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['wards'] });
    },
  });
}

export function useAdmitPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/admissions/admit', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMISSIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['wards'] });
    },
  });
}
