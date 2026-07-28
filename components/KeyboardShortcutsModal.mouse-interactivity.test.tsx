import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Keyboard: () => <svg data-testid="keyboard-icon" />,
}));

afterEach(() => {
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

describe('KeyboardShortcutsModal - Mouse Interactions & Keyboard Events', () => {
  it('calls onClose when the ✕ close button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close shortcuts modal/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when a non-Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Tab' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not attach Escape listener when isOpen is false', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders the modal content on open and removes it when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders "then" separator between multi-key shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const thenSeparators = screen.getAllByText('then');
    // Navigation group has 4 two-key shortcuts (G then D, G then C, G then P, G then U)
    expect(thenSeparators.length).toBe(4);
  });

  const onClose = vi.fn();
});
