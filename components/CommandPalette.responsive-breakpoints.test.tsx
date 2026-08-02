import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('CommandPalette - Responsive Breakpoints & Layout', () => {
  const onClose = vi.fn();
  const onOpenShortcuts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    Element.prototype.scrollIntoView = vi.fn();
  });

  // ── Outer wrapper ──────────────────────────────────────────────────────

  it('outer wrapper has pt-16 and sm:pt-24 responsive top padding', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('pt-16');
    expect(dialog).toHaveClass('sm:pt-24');
  });

  it('outer wrapper has px-4 horizontal padding', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('px-4');
  });

  it('outer wrapper is fixed and full-viewport', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('fixed');
    expect(dialog).toHaveClass('inset-0');
  });

  // ── Inner container ────────────────────────────────────────────────────

  it('inner container has max-w-xl class', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const innerContainer = container.querySelector('.max-w-xl');
    expect(innerContainer).toBeInTheDocument();
  });

  it('inner container has w-full class for full-width on mobile', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const innerContainer = container.querySelector('.max-w-xl');
    expect(innerContainer).toHaveClass('w-full');
  });

  it('inner container has rounded-2xl class', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const innerContainer = container.querySelector('.max-w-xl');
    expect(innerContainer).toHaveClass('rounded-2xl');
  });

  it('inner container has overflow-hidden class', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const innerContainer = container.querySelector('.max-w-xl');
    expect(innerContainer).toHaveClass('overflow-hidden');
  });

  // ── Results list ───────────────────────────────────────────────────────

  it('result list has max-h-80 class', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const resultList = container.querySelector('.max-h-80');
    expect(resultList).toBeInTheDocument();
  });

  it('result list has overflow-y-auto class', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const resultList = container.querySelector('.max-h-80');
    expect(resultList).toHaveClass('overflow-y-auto');
  });

  // ── Search input responsive text ───────────────────────────────────────

  it('search input has sm:text-base responsive text size', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('sm:text-base');
  });

  // ── z-index layering ───────────────────────────────────────────────────

  it('outer wrapper has z-[110] to sit above other overlays', () => {
    const { container } = render(
      <CommandPalette isOpen={true} onClose={onClose} onOpenShortcuts={onOpenShortcuts} />
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('z-[110]');
  });
});
