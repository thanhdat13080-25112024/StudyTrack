import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailVerifyBanner } from './EmailVerifyBanner';

const resend = vi.fn();
let verified = false;
vi.mock('@/features/auth/hooks', () => ({
  useResendVerification: () => ({ mutate: resend, isPending: false }),
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ user: { user: { email_verified: verified } } }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('EmailVerifyBanner', () => {
  it('is hidden when the user is verified', () => {
    verified = true;
    const { container } = render(<EmailVerifyBanner />);
    expect(container).toBeEmptyDOMElement();
  });
  it('shows + resends when unverified', () => {
    verified = false;
    render(<EmailVerifyBanner />);
    fireEvent.click(screen.getByRole('button'));
    expect(resend).toHaveBeenCalled();
  });
});
