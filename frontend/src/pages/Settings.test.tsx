import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';

const changeMutate = vi.fn((_v, opts) => opts?.onSuccess?.());
const deleteMutate = vi.fn((_v, opts) => opts?.onSuccess?.());
vi.mock('@/features/auth/hooks', () => ({
  useChangePassword: () => ({ mutate: changeMutate, isPending: false }),
  useDeleteAccount: () => ({ mutate: deleteMutate, isPending: false }),
  useExportData: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useResendVerification: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ user: { user: { email_verified: true } }, logout: vi.fn() }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

describe('Settings', () => {
  it('submits change-password', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('settings.currentPassword'), {
      target: { value: 'old123' },
    });
    fireEvent.change(screen.getByLabelText('auth.newPassword'), {
      target: { value: 'new12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'settings.changePasswordSubmit' }));
    await waitFor(() => expect(changeMutate).toHaveBeenCalled());
  });
});
