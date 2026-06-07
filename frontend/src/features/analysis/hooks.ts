/** Read-only TanStack Query hooks for the rule-based analysis layer. */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Direction, WeakSubject } from './types';

export function useWeakSubjects() {
  return useQuery({
    queryKey: ['analysis', 'weak-subjects'],
    queryFn: () => apiClient.get<WeakSubject[]>('/api/analysis/weak-subjects'),
  });
}

export function useDirection() {
  return useQuery({
    queryKey: ['analysis', 'direction'],
    queryFn: () => apiClient.get<Direction>('/api/analysis/direction'),
  });
}
