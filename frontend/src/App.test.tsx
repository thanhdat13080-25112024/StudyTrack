import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import App from '@/App';
import i18n from '@/lib/i18n';

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('boots and renders the Dashboard smoke page', () => {
    renderApp();
    // App name appears in the header.
    expect(screen.getAllByText('StudyTrack').length).toBeGreaterThan(0);
  });

  it('renders the localized welcome line via t()', () => {
    renderApp();
    // Default language is vi: the welcome line is rendered through t().
    expect(screen.getByText(i18n.t('dashboard.welcomeLine'))).toBeInTheDocument();
  });
});
