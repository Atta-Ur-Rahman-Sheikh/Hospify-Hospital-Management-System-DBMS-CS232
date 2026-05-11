import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const BILLS_QUERY_KEY = ['bills'];

export function useBills() {
  return useQuery({
    queryKey: BILLS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/billing');
      return res.data;
    },
  });
}

export function useBillByAdmission(admissionId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['bills', 'admission', admissionId],
    queryFn: async () => {
      const res = await api.get(`/billing/${admissionId}`);
      return res.data;
    },
    enabled: enabled && Boolean(admissionId),
  });
}

export function useBillingSummary(billId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['bills', 'summary', billId],
    queryFn: async () => {
      const res = await api.get(`/billing/summary/${billId}`);
      return res.data;
    },
    enabled: enabled && Boolean(billId),
  });
}

export function useGenerateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (admissionId) => {
      const res = await api.post(`/billing/generate/${admissionId}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BILLS_QUERY_KEY }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ billId, amount, payment_method }) => {
      const res = await api.post(`/billing/${billId}/pay`, {
        amount,
        payment_method,
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BILLS_QUERY_KEY }),
  });
}
