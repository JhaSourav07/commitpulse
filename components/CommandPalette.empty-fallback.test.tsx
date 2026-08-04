import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import CommandPalette from './CommandPalette';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Compass: () => <svg />,
  Sparkles: () => <svg />,
  Flame: () => <svg />,
  GitCompare: () => <svg />,
  Sliders: () => <svg />,
  Github: () => <svg />,
  Keyboard: () => <svg />,
  ArrowUp: () => <svg />,
  CornerDownLeft: () => <svg />,
  X: () => <svg data-testid="x-icon" />,
  ExternalLink: () => <svg />,
}));

describe('CommandPalette - Empty & Fallback State Verification', () => {
  const onClose = vi.fn();
  const onOpenShortcuts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    Element.prototype.scrollIntoView = vi.fn();
  });

  // ── Returns null when closed ───────────────────────────────────────────

  it('returns null (nothing rendered) when isOpen is false', () => {
    const { container } = render(
      <CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render the dialog when isOpen is false', () => {
    render(<CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render search input when isOpen is false', () => {
    render(<CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  // ── No matching commands message ───────────────────────────────────────

  it('shows "No matching commands found." when query has no results', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox'), 'zzznomatch99999');
    expect(screen.getByText('No matching commands found.')).toBeInTheDocument();
  });

  it('hides all command buttons when no results match', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox'), 'zzznomatch99999');
    expect(screen.queryByText('Go to Home')).not.toBeInTheDocument();
  });

  // ── All 8 items rendered on empty query ────────────────────────────────

  it('renders all 8 command items when query is empty', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Go to SVG Generator')).toBeInTheDocument();
    expect(screen.getByText('Go to Developer Compare')).toBeInTheDocument();
    expect(screen.getByText('Go to Burnout Radar')).toBeInTheDocument();
    expect(screen.getByText('Go to Customization Studio')).toBeInTheDocument();
    expect(screen.getByText('Open Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Scroll to Top of Page')).toBeInTheDocument();
    expect(screen.getByText('Open GitHub Repository')).toBeInTheDocument();
  });

  // ── Results return after clearing query ────────────────────────────────

  it('shows results again after clearing a no-match query', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No matching commands found.')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
  });

  // ── Transitions open → closed → open ──────────────────────────────────

  it('transitions from closed to open correctly', () => {
    const { rerender } = render(
      <CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('transitions from open to closed correctly', () => {
    const { rerender } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
