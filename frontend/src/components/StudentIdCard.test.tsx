import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { StudentIdCard } from './StudentIdCard';

function renderCard(props: React.ComponentProps<typeof StudentIdCard>) {
  return render(
    <I18nextProvider i18n={i18n}>
      <StudentIdCard {...props} />
    </I18nextProvider>,
  );
}

describe('StudentIdCard', () => {
  it('renders name (uppercased), class, and major', () => {
    renderCard({ name: 'Pat Nguyen', className: 'K65', major: 'KHMT', avatarUrl: null });
    expect(screen.getByText('PAT NGUYEN')).toBeInTheDocument();
    expect(screen.getByText(/K65/)).toBeInTheDocument();
    expect(screen.getByText(/KHMT/)).toBeInTheDocument();
  });

  it('renders an avatar image when provided', () => {
    renderCard({ name: 'A', className: '', major: '', avatarUrl: 'data:image/png;base64,xxx' });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,xxx');
  });
});
