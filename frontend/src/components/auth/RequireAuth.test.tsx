import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequireAuth } from './RequireAuth';
import { useAuthStore } from '@/store/authStore';

function renderAt(path: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>DASH</div>} />
          </Route>
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it('redirects to /login when unauthenticated', () => {
    renderAt('/dashboard');
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('renders the protected route when authenticated', () => {
    useAuthStore.setState({ token: 'jwt' });
    renderAt('/dashboard');
    expect(screen.getByText('DASH')).toBeInTheDocument();
  });
});
