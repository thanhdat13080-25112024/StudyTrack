// src/components/NotificationBell.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from './NotificationBell';

vi.mock('@/features/notifications/hooks', () => ({
  useUnreadCount: () => ({ data: { count: 3 } }),
  useNotifications: () => ({
    data: [{ id: 1, type: 'totally_unknown', payload: {}, read: false }],
  }),
  useMarkRead: () => ({ mutate: vi.fn() }),
  useMarkAllRead: () => ({ mutate: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('NotificationBell', () => {
  it('shows the unread count badge', () => {
    wrap(<NotificationBell />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders a generic label for unknown notification types, not the raw slug', () => {
    wrap(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: 'notifications.title' }));
    expect(screen.getByText('notifications.generic')).toBeInTheDocument();
    expect(screen.queryByText('totally_unknown')).not.toBeInTheDocument();
  });
});
