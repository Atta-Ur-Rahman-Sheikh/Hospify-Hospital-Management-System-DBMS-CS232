import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const DOCTORS_QUERY_KEY = ['doctors'];

export function useDoctors() {
  return useQuery({
    queryKey: DOCTORS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/doctors');
      return res.data;
    },
  });
}

export function useBusyDoctors({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['doctors', 'busy'],
    queryFn: async () => {
      const res = await api.get('/wards/reports/busy-doctors');
      return res.data;
    },
    enabled,
  });
}
