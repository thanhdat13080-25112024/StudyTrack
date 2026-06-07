/** TanStack Query CRUD hooks for courses. A course change cascades grades, so
 * mutations also invalidate the grades list + the GPA summary. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { GPA_KEY, GRADES_KEY } from '@/features/grades/hooks';
import type { Course, CourseCreate } from './types';

export const COURSES_KEY = ['courses'] as const;

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: COURSES_KEY });
    void qc.invalidateQueries({ queryKey: GRADES_KEY });
    void qc.invalidateQueries({ queryKey: GPA_KEY });
  };
}

export function useCourses() {
  return useQuery({ queryKey: COURSES_KEY, queryFn: () => apiClient.get<Course[]>('/api/courses') });
}

export function useCreateCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (d: CourseCreate) => apiClient.post<Course>('/api/courses', d),
    onSuccess: invalidate,
  });
}

export function useUpdateCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseCreate }) =>
      apiClient.put<Course>(`/api/courses/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/courses/${id}`),
    onSuccess: invalidate,
  });
}
