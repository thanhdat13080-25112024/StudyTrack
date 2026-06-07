/** TanStack Query hooks for study sessions, dashboard, and suggestions. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Dashboard, StudySession, StudySessionCreate, Suggestion, SuggestionIn } from './types';

export const DASHBOARD_KEY = ['dashboard'] as const;
export const SESSIONS_KEY = ['sessions'] as const;

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => apiClient.get<Dashboard>('/api/dashboard'),
  });
}

export function useSessions(limit?: number) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, limit] as const,
    queryFn: () =>
      apiClient.get<StudySession[]>(
        limit ? `/api/sessions?limit=${limit}` : '/api/sessions',
      ),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StudySessionCreate) =>
      apiClient.post<StudySession>('/api/sessions', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      void qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/sessions/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      void qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

/** Live suggestion for the Focus form; called (debounced) on input change. */
export function useSuggestion() {
  return useMutation({
    mutationFn: (data: SuggestionIn) => apiClient.post<Suggestion>('/api/suggestions', data),
  });
}
