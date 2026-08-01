import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Keyboard: () => <svg data-testid="keyboard-icon" />,
}));

afterEach(() => {
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

describe('KeyboardShortcutsModal - Empty & Fallback State Verification', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('renders nothing (returns null) when isOpen is false', () => {
    const { container } = render(<KeyboardShortcutsModal isOpen={false} onClose={() => {}} />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render the dialog heading when closed', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={() => {}} />);

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('does not render any shortcut group content when closed', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={() => {}} />);

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('General')).not.toBeInTheDocument();
    expect(screen.queryByText('Go to Home')).not.toBeInTheDocument();
  });

  it('does not lock body scroll when isOpen is false', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={() => {}} />);

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('transitions from hidden to visible when isOpen changes from false to true', () => {
    const onClose = vi.fn();
    const { rerender } = render(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('transitions from visible to hidden when isOpen changes from true to false', () => {
    const onClose = vi.fn();
    const { rerender } = render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<KeyboardShortcutsModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders all shortcut entries when open — no missing keys or labels', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

    // Navigation shortcuts
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Go to Contributors')).toBeInTheDocument();
    expect(screen.getByText('Go to Compare')).toBeInTheDocument();
    expect(screen.getByText('Go to Customization Studio')).toBeInTheDocument();

    // General shortcuts
    expect(screen.getByText('Open keyboard shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Close this modal')).toBeInTheDocument();
  });

  it('renders the footer hint text when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/to toggle this modal/i)).toBeInTheDocument();
  });
});
