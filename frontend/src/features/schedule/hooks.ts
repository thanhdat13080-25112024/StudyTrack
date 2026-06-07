/** TanStack Query hooks for the weekly schedule (full CRUD). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { ScheduleItem, ScheduleItemCreate, ScheduleItemUpdate } from './types';

export const SCHEDULE_KEY = ['schedule'] as const;

export function useSchedule() {
  return useQuery({
    queryKey: SCHEDULE_KEY,
    queryFn: () => apiClient.get<ScheduleItem[]>('/api/schedule'),
  });
}

export function useCreateScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleItemCreate) =>
      apiClient.post<ScheduleItem>('/api/schedule', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  });
}

export function useUpdateScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; data: ScheduleItemUpdate }) =>
      apiClient.put<ScheduleItem>(`/api/schedule/${vars.id}`, vars.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  });
}

export function useDeleteScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/schedule/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  });
}
