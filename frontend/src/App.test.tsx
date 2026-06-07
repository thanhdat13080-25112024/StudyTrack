import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import App from '@/App';
import i18n from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';

// The Dashboard fetches /api/dashboard on render; stub the hook so the routing
// test stays a pure render check (no network), independent of the API shape.
vi.mock('@/features/sessions/hooks', () => ({
  useDashboard: () => ({ data: undefined, isLoading: true }),
}));

function renderApp(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[initialPath]}>
          <App />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('App routing', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it('redirects unauthenticated users to the login page', () => {
    renderApp('/');
    expect(screen.getByText(i18n.t('auth.loginTitle'))).toBeInTheDocument();
  });

  it('renders the Dashboard when authenticated', () => {
    useAuthStore.setState({ token: 'jwt' });
    renderApp('/dashboard');
    expect(screen.getAllByText('StudyTrack').length).toBeGreaterThan(0);
  });
});
