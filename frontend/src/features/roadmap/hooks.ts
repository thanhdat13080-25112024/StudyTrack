/** Roadmap generate (stateless) + apply (persists planned_semester_id). Apply
 * cascades courses/grades/gpa/semesters, so it invalidates those caches. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { COURSES_KEY } from '@/features/courses/hooks';
import { GPA_KEY, GRADES_KEY } from '@/features/grades/hooks';
import type { RoadmapIn, RoadmapPlan } from './types';

export function useGenerateRoadmap() {
  return useMutation({
    mutationFn: (d: RoadmapIn) => apiClient.post<RoadmapPlan>('/api/roadmap/generate', d),
  });
}

export function useApplyRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: RoadmapIn) => apiClient.post<RoadmapPlan>('/api/roadmap/apply', d),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: COURSES_KEY });
      void qc.invalidateQueries({ queryKey: GRADES_KEY });
      void qc.invalidateQueries({ queryKey: GPA_KEY });
      void qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
}
