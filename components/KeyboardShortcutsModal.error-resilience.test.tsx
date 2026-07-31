import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Keyboard: () => <svg data-testid="keyboard-icon" />,
}));

afterEach(() => {
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

describe('KeyboardShortcutsModal - Error Resilience', () => {
  it('renders without crashing when isOpen is true', () => {
    const onClose = vi.fn();
    expect(() => render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />)).not.toThrow();
  });

  it('renders without crashing when isOpen is false', () => {
    const onClose = vi.fn();
    expect(() => render(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />)).not.toThrow();
  });

  it('returns null without crashing when isOpen is false', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets body overflow to hidden when opened', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow to empty string when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    expect(document.body.style.overflow).toBe('');
  });

  it('restores body overflow on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('does not throw when onClose is a no-op function', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cleans up the keydown event listener when unmounted', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const onClose = vi.fn();
    const { unmount } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
