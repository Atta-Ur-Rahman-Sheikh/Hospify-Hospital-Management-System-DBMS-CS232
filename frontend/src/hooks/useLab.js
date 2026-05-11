import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const LAB_ORDERS_QUERY_KEY = ['lab', 'orders'];

export function useLabOrders() {
  return useQuery({
    queryKey: LAB_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/lab/orders/all');
      return res.data;
    },
  });
}

export function useUpdateLabOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/lab/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LAB_ORDERS_QUERY_KEY }),
  });
}

export function useLabResult(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['lab', 'result', orderId],
    queryFn: async () => {
      const res = await api.get(`/lab/orders/${orderId}/result`);
      return res.data;
    },
    enabled: enabled && Boolean(orderId),
    retry: false, // 404 means "no result yet"
  });
}
