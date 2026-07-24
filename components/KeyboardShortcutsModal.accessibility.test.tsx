import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Keyboard: () => <svg data-testid="keyboard-icon" />,
}));

describe('KeyboardShortcutsModal Accessibility Standards & ARIA Compliance', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('renders with role="dialog" and aria-modal="true" when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has a descriptive aria-label on the dialog element', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Keyboard shortcuts');
  });

  it('close button has an accessible aria-label', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close shortcuts modal/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('aria-label', 'Close shortcuts modal');
  });

  it('close button is keyboard focusable via tab', async () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const user = userEvent.setup();
    await user.tab();

    const closeButton = screen.getByRole('button', { name: /close shortcuts modal/i });
    expect(closeButton).toHaveFocus();
  });

  it('backdrop has aria-hidden="true" so screen readers skip it', () => {
    const { container } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('renders the visible heading "Keyboard Shortcuts"', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('renders all shortcut group titles', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('renders all shortcut description labels', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Go to Contributors')).toBeInTheDocument();
    expect(screen.getByText('Go to Compare')).toBeInTheDocument();
    expect(screen.getByText('Go to Customization Studio')).toBeInTheDocument();
    expect(screen.getByText('Open keyboard shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Close this modal')).toBeInTheDocument();
  });

  it('renders <kbd> elements for each key in shortcuts', () => {
    const { container } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('does not render when isOpen is false', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
