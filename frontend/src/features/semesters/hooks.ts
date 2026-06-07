/** TanStack Query CRUD hooks for semesters. A semester change cascades grades,
 * so mutations also invalidate the grades list + the GPA summary. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { GPA_KEY, GRADES_KEY } from '@/features/grades/hooks';
import type { Semester, SemesterCreate } from './types';

export const SEMESTERS_KEY = ['semesters'] as const;

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: SEMESTERS_KEY });
    void qc.invalidateQueries({ queryKey: GRADES_KEY });
    void qc.invalidateQueries({ queryKey: GPA_KEY });
  };
}

export function useSemesters() {
  return useQuery({
    queryKey: SEMESTERS_KEY,
    queryFn: () => apiClient.get<Semester[]>('/api/semesters'),
  });
}

export function useCreateSemester() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (d: SemesterCreate) => apiClient.post<Semester>('/api/semesters', d),
    onSuccess: invalidate,
  });
}

export function useUpdateSemester() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SemesterCreate }) =>
      apiClient.put<Semester>(`/api/semesters/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteSemester() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/semesters/${id}`),
    onSuccess: invalidate,
  });
}
