/** TanStack Query hooks for deadlines. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Deadline, DeadlineCreate, DeadlineUpdate } from './types';

export const DEADLINES_KEY = ['deadlines'] as const;

export function useDeadlines() {
  return useQuery({
    queryKey: DEADLINES_KEY,
    queryFn: () => apiClient.get<Deadline[]>('/api/deadlines'),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: DEADLINES_KEY });
}

export function useCreateDeadline() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (d: DeadlineCreate) => apiClient.post<Deadline>('/api/deadlines', d),
    onSuccess: invalidate,
  });
}

export function useUpdateDeadline() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeadlineUpdate }) =>
      apiClient.put<Deadline>(`/api/deadlines/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteDeadline() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/deadlines/${id}`),
    onSuccess: invalidate,
  });
}
