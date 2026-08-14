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
    vi.restoreAllMocks();
  });

  it('navigates client-side via router.push on the g-then-key sequence', () => {
    renderHook(() => useKeyboardShortcuts());

    press('g');
    press('c');

    expect(push).toHaveBeenCalledWith('/contributors');
  });

  it('maps internal shortcut keys to their respective routes', () => {
    renderHook(() => useKeyboardShortcuts());

    for (const [key, route] of Object.entries({
      h: '/',
      d: '/',
      p: '/customize',
      c: '/contributors',
      u: '/customize',
    })) {
      push.mockClear();
      press('g');
      press(key);
      expect(push).toHaveBeenCalledWith(route);
    }
  });

  it('opens external repository link for g+r', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderHook(() => useKeyboardShortcuts());

    press('g');
    press('r');

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/JhaSourav07/commitpulse',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('triggers onOpenShortcuts when ? or Shift+/ is pressed', () => {
    const onOpenShortcuts = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onOpenShortcuts }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', shiftKey: true }));
    expect(onOpenShortcuts).toHaveBeenCalledTimes(2);
  });

  it('triggers onFocusSearch when / is pressed (unmodified)', () => {
    const onFocusSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onFocusSearch }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(onFocusSearch).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleCommandPalette when Ctrl+K is pressed', () => {
    const onToggleCommandPalette = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggleCommandPalette }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(onToggleCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('triggers onCloseActiveModal when Escape key is pressed', () => {
    const onCloseActiveModal = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onCloseActiveModal }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onCloseActiveModal).toHaveBeenCalledTimes(1);
  });

  it('does not navigate when the second key is not a shortcut', () => {
    renderHook(() => useKeyboardShortcuts());

    press('g');
    press('x');

    expect(push).not.toHaveBeenCalled();
  });

  it('ignores the sequence while typing in an input field or element with textbox role', () => {
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));

    expect(push).not.toHaveBeenCalled();

    const editable = document.createElement('div');
    editable.setAttribute('role', 'textbox');
    document.body.appendChild(editable);
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));

    expect(push).not.toHaveBeenCalled();

    input.remove();
    editable.remove();
  });
});
