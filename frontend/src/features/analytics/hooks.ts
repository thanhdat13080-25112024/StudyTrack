/** TanStack Query hook for study analytics. */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Analytics } from './types';

export const ANALYTICS_KEY = ['analytics'] as const;

export function useAnalytics(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (fromDate) params.set('from_date', fromDate);
  if (toDate) params.set('to_date', toDate);
  const qs = params.toString();
  const url = qs ? `/api/analytics?${qs}` : '/api/analytics';

  return useQuery({
    queryKey: [...ANALYTICS_KEY, fromDate, toDate] as const,
    queryFn: () => apiClient.get<Analytics>(url),
  });
}
