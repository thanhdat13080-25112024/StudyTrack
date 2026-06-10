import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@/lib/i18n';
import { AppShell } from '@/components/shell/AppShell';

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
describe('AppShell', () => {
  it('renders all nav destinations', () => {
    renderAt('/dashboard');
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/focus', '/grades', '/deadlines']),
    );
  });
  it('marks the active route with aria-current', () => {
    renderAt('/grades');
    const active = screen.getByRole('link', { current: 'page' });
    expect(active).toHaveAttribute('href', '/grades');
  });
});
