/** TanStack Query hooks for grades, the GPA/CPA summary, and what-if. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Grade, GradeCreate, GpaSummary, WhatIfIn, WhatIfOut } from './types';

export const GRADES_KEY = ['grades'] as const;
export const GPA_KEY = ['gpa'] as const;

/** Invalidate everything a grade change can move (the grades list + the CPA). */
export function useInvalidateAcademic() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: GRADES_KEY });
    void qc.invalidateQueries({ queryKey: GPA_KEY });
  };
}

export function useGrades(semesterId?: number) {
  return useQuery({
    queryKey: [...GRADES_KEY, semesterId] as const,
    queryFn: () =>
      apiClient.get<Grade[]>(semesterId ? `/api/grades?semester_id=${semesterId}` : '/api/grades'),
  });
}

export function useGpa() {
  return useQuery({ queryKey: GPA_KEY, queryFn: () => apiClient.get<GpaSummary>('/api/gpa') });
}

export function useCreateGrade() {
  const invalidate = useInvalidateAcademic();
  return useMutation({
    mutationFn: (d: GradeCreate) => apiClient.post<Grade>('/api/grades', d),
    onSuccess: invalidate,
  });
}

export function useUpdateGrade() {
  const invalidate = useInvalidateAcademic();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GradeCreate }) =>
      apiClient.put<Grade>(`/api/grades/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteGrade() {
  const invalidate = useInvalidateAcademic();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/grades/${id}`),
    onSuccess: invalidate,
  });
}

export function useWhatIf() {
  return useMutation({
    mutationFn: (d: WhatIfIn) => apiClient.post<WhatIfOut>('/api/gpa/what-if', d),
  });
}
