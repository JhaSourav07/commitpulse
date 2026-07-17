import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('navigates client-side via router.push on the g-then-key sequence', () => {
    renderHook(() => useKeyboardShortcuts());

    press('g');
    press('c');

    // Client navigation (no full document reload / window.location.assign).
    expect(push).toHaveBeenCalledWith('/contributors');
  });

  it('maps each shortcut key to its route', () => {
    renderHook(() => useKeyboardShortcuts());

    for (const [key, route] of Object.entries({
      d: '/',
      c: '/contributors',
      p: '/compare',
      u: '/customize',
    })) {
      push.mockClear();
      press('g');
      press(key);
      expect(push).toHaveBeenCalledWith(route);
    }
  });

  it('does not navigate when the second key is not a shortcut', () => {
    renderHook(() => useKeyboardShortcuts());

    press('g');
    press('x');

    expect(push).not.toHaveBeenCalled();
  });

  it('ignores the sequence while typing in an input field', () => {
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));

    expect(push).not.toHaveBeenCalled();
    input.remove();
  });
});
