import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResetPassword from './ResetPassword';

const mutate = vi.fn((_vars, opts) => opts?.onSuccess?.());
vi.mock('@/features/auth/hooks', () => ({
  useResetPassword: () => ({ mutate, isPending: false }),
}));

// Match the codebase convention: t() echoes the key in tests.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function renderAt(url: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <ResetPassword />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResetPassword', () => {
  it('submits the token from the URL with the new password', async () => {
    renderAt('/reset-password?token=ABC');
    fireEvent.change(screen.getByLabelText('auth.newPassword'), {
      target: { value: 'newpass123' },
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { token: 'ABC', new_password: 'newpass123' },
        expect.anything(),
      ),
    );
  });
});
