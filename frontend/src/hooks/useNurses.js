import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useVitalsForAdmission(admissionId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['nurses', 'vitals', admissionId],
    queryFn: async () => {
      const res = await api.get(`/nurses/vitals/${admissionId}`);
      return res.data;
    },
    enabled: enabled && Boolean(admissionId),
  });
}

export function useVitalAverages(admissionId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['nurses', 'vital-averages', admissionId],
    queryFn: async () => {
      const res = await api.get(`/nurses/vitals/${admissionId}/averages`);
      return res.data;
    },
    enabled: enabled && Boolean(admissionId),
  });
}
