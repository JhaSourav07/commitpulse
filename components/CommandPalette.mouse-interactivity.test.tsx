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

describe('CommandPalette - Mouse Interactions & Keyboard Navigation', () => {
  const onClose = vi.fn();
  const onOpenShortcuts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    Element.prototype.scrollIntoView = vi.fn();
  });

  // ── Close interactions ─────────────────────────────────────────────────

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the ✕ close button is clicked', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    fireEvent.click(screen.getByRole('button', { name: /close command palette/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when a non-Escape key is pressed', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    fireEvent.keyDown(window, { key: 'Tab' });
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Navigation item click ──────────────────────────────────────────────

  it('calls router.push with correct path when "Go to Home" is clicked', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Go to Home'));
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls router.push with correct path when "Go to Developer Compare" is clicked', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Go to Developer Compare'));
    expect(mockPush).toHaveBeenCalledWith('/compare');
  });

  it('calls onOpenShortcuts when "Open Keyboard Shortcuts" is clicked', async () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Open Keyboard Shortcuts'));
    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  // ── mouseEnter updates selectedIndex (highlight) ──────────────────────

  it('mouseEnter on a result item applies the selected highlight classes', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    // All items are rendered as buttons with data-index
    const secondItem = screen
      .getAllByRole('button')
      .find((btn) => btn.getAttribute('data-index') === '1');
    expect(secondItem).toBeDefined();
    fireEvent.mouseEnter(secondItem!);

    // After mouseEnter the second item should have the selected emerald class
    expect(secondItem).toHaveClass('bg-emerald-500/10');
  });

  // ── ArrowDown / ArrowUp navigation ────────────────────────────────────

  it('ArrowDown moves selection to the next item', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    // Item at index 0 starts selected
    const firstItem = screen
      .getAllByRole('button')
      .find((btn) => btn.getAttribute('data-index') === '0');
    expect(firstItem).toHaveClass('bg-emerald-500/10');

    fireEvent.keyDown(window, { key: 'ArrowDown' });

    const secondItem = screen
      .getAllByRole('button')
      .find((btn) => btn.getAttribute('data-index') === '1');
    expect(secondItem).toHaveClass('bg-emerald-500/10');
  });

  it('ArrowUp wraps selection to last item when at first', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    fireEvent.keyDown(window, { key: 'ArrowUp' });

    // Should wrap to last item (index 8 — 9 total items)
    const lastItem = screen
      .getAllByRole('button')
      .find((btn) => btn.getAttribute('data-index') === '8');
    expect(lastItem).toHaveClass('bg-emerald-500/10');
  });

  // ── Enter executes the selected item ──────────────────────────────────

  it('Enter key executes the selected (first) item action', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);

    // First item is "Go to Home" → router.push('/')
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
