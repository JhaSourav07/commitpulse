import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi } from 'vitest';
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

afterEach(() => {
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

describe('CommandPalette - Error Resilience', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('renders without crashing when onOpenShortcuts is not provided', () => {
    expect(() => render(<CommandPalette isOpen={true} onClose={vi.fn()} />)).not.toThrow();
  });

  it('renders without crashing when isOpen is true', () => {
    expect(() =>
      render(<CommandPalette isOpen={true} onClose={vi.fn()} onOpenShortcuts={vi.fn()} />)
    ).not.toThrow();
  });

  it('renders without crashing when isOpen is false', () => {
    expect(() =>
      render(<CommandPalette isOpen={false} onClose={vi.fn()} onOpenShortcuts={vi.fn()} />)
    ).not.toThrow();
  });

  it('sets body overflow to hidden when opened', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed via rerender', () => {
    const onClose = vi.fn();
    const { rerender } = render(<CommandPalette isOpen={true} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<CommandPalette isOpen={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores body overflow on unmount', () => {
    const { unmount } = render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('removes keydown listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('does not throw when onClose is a no-op', () => {
    render(<CommandPalette isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not throw on Escape when no items match (filteredItems empty)', async () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} />);

    // Type a query that yields no results first
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'zzznomatch99' } });
    expect(screen.getByText('No matching commands found.')).toBeInTheDocument();

    // Then press Escape — should not throw
    expect(() => fireEvent.keyDown(window, { key: 'Escape' })).not.toThrow();
    expect(onClose).toHaveBeenCalled();
  });

  it('does not crash when Enter is pressed with empty filteredItems', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'zzznomatch99' } });

    expect(() => fireEvent.keyDown(window, { key: 'Enter' })).not.toThrow();
  });
});
