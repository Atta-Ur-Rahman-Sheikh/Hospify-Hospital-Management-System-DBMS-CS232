import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const MEDICINES_QUERY_KEY = ['pharmacy', 'medicines'];

export function useMedicines() {
  return useQuery({
    queryKey: MEDICINES_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/pharmacy/medicines');
      return res.data;
    },
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['pharmacy', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/inventory/low-stock');
      return res.data;
    },
  });
}

export function useTopMedicines() {
  return useQuery({
    queryKey: ['pharmacy', 'top'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/top-medicines');
      return res.data;
    },
  });
}

export function useUpdateMedicineStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await api.patch(`/pharmacy/inventory/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacy'] }),
  });
}
