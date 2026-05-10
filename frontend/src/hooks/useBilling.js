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
