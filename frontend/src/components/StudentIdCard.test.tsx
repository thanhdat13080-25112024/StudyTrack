import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentIdCard } from './StudentIdCard';

describe('StudentIdCard', () => {
  it('renders name (uppercased), class, and major', () => {
    render(<StudentIdCard name="Pat Nguyen" className="K65" major="KHMT" avatarUrl={null} />);
    expect(screen.getByText('PAT NGUYEN')).toBeInTheDocument();
    expect(screen.getByText(/K65/)).toBeInTheDocument();
    expect(screen.getByText(/KHMT/)).toBeInTheDocument();
  });

  it('renders an avatar image when provided', () => {
    render(<StudentIdCard name="A" className="" major="" avatarUrl="data:image/png;base64,xxx" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,xxx');
  });
});
