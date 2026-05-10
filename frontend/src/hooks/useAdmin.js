import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const USERS_QUERY_KEY = ['admin', 'users'];
export const AUDIT_QUERY_KEY = ['admin', 'audit-log'];
export const ALERTS_QUERY_KEY = ['admin', 'alerts'];

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
  });
}

export function useAuditLog({ enabled = true } = {}) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/admin/audit-log');
      return res.data;
    },
    enabled,
  });
}

export function useAlerts({ enabled = true } = {}) {
  return useQuery({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/admin/alerts');
      return res.data;
    },
    enabled,
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await api.patch(`/admin/users/${userId}/status`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/admin/users', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}

export function useBackupPush() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/backup/push');
      return res.data;
    },
  });
}

export function useBackupPull() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/backup/pull');
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId) => {
      const res = await api.patch(`/admin/alerts/${alertId}/resolve`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERTS_QUERY_KEY }),
  });
}
