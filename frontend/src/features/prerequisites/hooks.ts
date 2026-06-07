/** TanStack Query hooks for course prerequisites (self-M2M Course↔Course). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Prerequisite, PrerequisiteCreate } from './types';

export const PREREQUISITES_KEY = ['prerequisites'] as const;

export function usePrerequisites() {
  return useQuery({
    queryKey: PREREQUISITES_KEY,
    queryFn: () => apiClient.get<Prerequisite[]>('/api/prerequisites'),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: PREREQUISITES_KEY });
}

export function useCreatePrerequisite() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (d: PrerequisiteCreate) => apiClient.post<Prerequisite>('/api/prerequisites', d),
    onSuccess: invalidate,
  });
}

export function useDeletePrerequisite() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/prerequisites/${id}`),
    onSuccess: invalidate,
  });
}
