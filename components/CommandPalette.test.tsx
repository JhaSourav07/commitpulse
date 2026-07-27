import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import CommandPalette from './CommandPalette';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

describe('CommandPalette Component', () => {
  const onClose = vi.fn();
  const onOpenShortcuts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('does not render when isOpen is false', () => {
    render(<CommandPalette isOpen={false} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with role="dialog" and aria-label="Command Palette" when open', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Command Palette');
  });

  it('filters command list when typing in search input', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    const searchInput = screen.getByRole('searchbox');
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Go to Burnout Radar')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(searchInput, 'Burnout');

    expect(screen.getByText('Go to Burnout Radar')).toBeInTheDocument();
    expect(screen.queryByText('Go to Home')).not.toBeInTheDocument();
  });

  it('displays empty state message when search query has no matches', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    const searchInput = screen.getByRole('searchbox');
    const user = userEvent.setup();
    await user.type(searchInput, 'nonexistentquery12345');

    expect(screen.getByText('No matching commands found.')).toBeInTheDocument();
  });

  it('navigates to route when clicking a navigation item', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    const homeItem = screen.getByText('Go to SVG Generator');
    const user = userEvent.setup();
    await user.click(homeItem);

    expect(mockPush).toHaveBeenCalledWith('/generator');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenShortcuts action when keyboard shortcuts item is selected', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    const shortcutsItem = screen.getByText('Open Keyboard Shortcuts');
    const user = userEvent.setup();
    await user.click(shortcutsItem);

    expect(onClose).toHaveBeenCalled();
    expect(onOpenShortcuts).toHaveBeenCalled();
  });
});
