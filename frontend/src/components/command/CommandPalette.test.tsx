import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { CommandPalette } from './CommandPalette';

// cmdk scrolls the active item into view and observes resize; jsdom has neither.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderPalette(onOpenChange = vi.fn()) {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <CommandPalette open onOpenChange={onOpenChange} />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

describe('CommandPalette', () => {
  it('renders navigate items when open', () => {
    renderPalette();
    expect(screen.getByText(i18n.t('nav.dashboard'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('nav.deadlines'))).toBeInTheDocument();
  });

  it('filters the list as the user types', () => {
    renderPalette();
    const input = screen.getByPlaceholderText(i18n.t('command.placeholder'));
    fireEvent.change(input, { target: { value: 'deadlin' } });
    expect(screen.getByText(i18n.t('nav.deadlines'))).toBeInTheDocument();
    // A non-matching nav row is filtered out of the list.
    expect(screen.queryByText(i18n.t('nav.schedule'))).not.toBeInTheDocument();
  });

  it('closes the palette when an item is selected', () => {
    const { onOpenChange } = renderPalette();
    fireEvent.click(screen.getByText(i18n.t('nav.dashboard')));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
