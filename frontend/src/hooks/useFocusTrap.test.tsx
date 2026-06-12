import { describe, it, expect, beforeEach } from 'vitest';
import { useRef, useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Harness() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  return (
    <div>
      <button data-testid="trigger" onClick={() => setOpen(true)}>
        open
      </button>
      {open && (
        <div ref={ref} role="dialog" tabIndex={-1}>
          <button data-testid="first">first</button>
          <button data-testid="middle">middle</button>
          <button data-testid="last" onClick={() => setOpen(false)}>
            close
          </button>
        </div>
      )}
    </div>
  );
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('locks body scroll while open and restores it on close', () => {
    const { getByTestId } = render(<Harness />);
    expect(document.body.style.overflow).toBe('');

    act(() => getByTestId('trigger').click());
    expect(document.body.style.overflow).toBe('hidden');

    act(() => getByTestId('last').click());
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus to the first focusable element on open', () => {
    const { getByTestId } = render(<Harness />);
    act(() => getByTestId('trigger').click());
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('wraps focus to the last element on Shift-Tab from the first', () => {
    const { getByTestId } = render(<Harness />);
    act(() => getByTestId('trigger').click());
    const first = getByTestId('first');
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(getByTestId('last'));
  });

  it('wraps focus to the first element on Tab from the last', () => {
    const { getByTestId } = render(<Harness />);
    act(() => getByTestId('trigger').click());
    const last = getByTestId('last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('returns focus to the trigger on close', () => {
    const { getByTestId } = render(<Harness />);
    const trigger = getByTestId('trigger');
    // Mirror a real interaction: the trigger holds focus when it is activated.
    act(() => {
      trigger.focus();
      trigger.click();
    });
    act(() => getByTestId('last').click());
    expect(document.activeElement).toBe(trigger);
  });
});
