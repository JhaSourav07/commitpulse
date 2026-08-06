import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import CommandPalette from './CommandPalette';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Compass: () => <svg data-testid="compass-icon" />,
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  Flame: () => <svg data-testid="flame-icon" />,
  GitCompare: () => <svg data-testid="gitcompare-icon" />,
  Sliders: () => <svg data-testid="sliders-icon" />,
  Github: () => <svg data-testid="github-icon" />,
  Keyboard: () => <svg data-testid="keyboard-icon" />,
  ArrowUp: () => <svg data-testid="arrowup-icon" />,
  CornerDownLeft: () => <svg data-testid="cornerdownleft-icon" />,
  X: () => <svg data-testid="x-icon" />,
  ExternalLink: () => <svg data-testid="externallink-icon" />,
}));

describe('CommandPalette Accessibility Standards & ARIA Compliance', () => {
  const onClose = vi.fn();
  const onOpenShortcuts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders with role="dialog" when open', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dialog has aria-modal="true"', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('dialog has aria-label="Command Palette"', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Command Palette');
  });

  it('search input has role="searchbox"', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('search input has aria-label="Search commands"', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search commands');
  });

  it('close button has aria-label="Close command palette"', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const closeBtn = screen.getByRole('button', { name: /close command palette/i });
    expect(closeBtn).toHaveAttribute('aria-label', 'Close command palette');
  });

  it('backdrop has aria-hidden="true"', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('footer contains <kbd> elements for navigation hints', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('footer has keyboard navigation labels (Navigate, Select, Close)', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('search input is keyboard focusable via tab', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('does not render when isOpen is false', () => {
    render(<CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"?" shortcut kbd renders inline next to Open Keyboard Shortcuts item', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    // shortcut kbds inside result items (not footer)
    const resultKbds = Array.from(container.querySelectorAll('kbd')).filter(
      (k) => k.textContent === '?'
    );
    expect(resultKbds.length).toBeGreaterThan(0);
  });
});
