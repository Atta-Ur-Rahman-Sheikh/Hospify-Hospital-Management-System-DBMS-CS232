import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import api from '../api/axios';
import { db } from '../firebase';

export const WARDS_QUERY_KEY = ['wards'];

export function useWards() {
  return useQuery({
    queryKey: WARDS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/wards');
      return res.data;
    },
  });
}

/**
 * Mirrors the existing real-time Firestore `beds` collection listener so
 * bed status changes propagate without a full refetch — same logic as the
 * legacy Beds page, just centralized.
 */
export function useBedsRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'beds'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified' || change.type === 'added') {
            const bedData = change.doc.data();
            qc.setQueryData(WARDS_QUERY_KEY, (prev) => {
              if (!Array.isArray(prev)) return prev;
              return prev.map((ward) => ({
                ...ward,
                beds: (ward.beds || []).map((bed) =>
                  bed.bed_id === bedData.bed_id
                    ? { ...bed, status: bedData.status }
                    : bed
                ),
              }));
            });
          }
        });
      },
      (err) => {
        console.error('Firebase real-time listener error:', err);
      }
    );
    return () => unsubscribe();
  }, [qc]);
}

export function useUpdateBedStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bedId, status }) => {
      const res = await api.patch(`/wards/beds/${bedId}/status`, { status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WARDS_QUERY_KEY }),
  });
}

export function useAvailableBeds() {
  return useQuery({
    queryKey: ['beds', 'available'],
    queryFn: async () => {
      const res = await api.get('/wards/beds/available');
      return res.data;
    },
  });
}
