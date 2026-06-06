import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { AuthForm } from './AuthForm';

function renderForm(mode: 'login' | 'register', onSubmit = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthForm mode={mode} onSubmit={onSubmit} pending={false} />
    </I18nextProvider>,
  );
}

describe('AuthForm', () => {
  it('shows a name field only in register mode', () => {
    const { rerender } = renderForm('login');
    expect(screen.queryByLabelText(/name|họ tên/i)).toBeNull();
    rerender(
      <I18nextProvider i18n={i18n}>
        <AuthForm mode="register" onSubmit={vi.fn()} pending={false} />
      </I18nextProvider>,
    );
    expect(screen.getByLabelText(/name|họ tên/i)).toBeInTheDocument();
  });

  it('validates email + password before submitting', async () => {
    const onSubmit = vi.fn();
    renderForm('login', onSubmit);
    fireEvent.click(screen.getByRole('button', { name: /login|đăng nhập/i }));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });
});
