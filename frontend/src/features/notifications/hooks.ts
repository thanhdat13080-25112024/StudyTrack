/** TanStack Query hooks for notifications. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Notification, UnreadCount } from './types';

export const NOTIFICATIONS_KEY = ['notifications'] as const;
export const UNREAD_KEY = ['notifications', 'unread-count'] as const;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => apiClient.get<Notification[]>('/api/notifications'),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => apiClient.get<UnreadCount>('/api/notifications/unread-count'),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    void qc.invalidateQueries({ queryKey: UNREAD_KEY });
  };
}

export function useMarkRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => apiClient.post<void>(`/api/notifications/${id}/read`),
    onSuccess: invalidate,
  });
}

export function useMarkAllRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => apiClient.post<void>('/api/notifications/read-all'),
    onSuccess: invalidate,
  });
}
