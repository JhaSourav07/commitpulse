import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loading from './loading';

/**
 * Tests for the Contributors Loading component.
 *
 * The `loading.test.tsx` file covers the happy-path render, text content,
 * and animated elements.  This suite focuses on what is NOT covered there:
 *
 *   - ARIA role and live-region semantics (role="status", aria-live="polite")
 *   - DOM structure completeness (spinner ring + glow, two text nodes)
 *   - Keyboard-navigation friendliness (no interactive element grabs focus)
 *   - Visual layout classes that govern the loading UX
 */
describe('Contributors Loading — structure & accessibility', () => {
  it('renders exactly one status landmark', () => {
    render(<Loading />);
    const landmarks = screen.getAllByRole('status');
    expect(landmarks).toHaveLength(1);
  });

  it('status landmark carries aria-live="polite" for screen-reader announcements', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('contains both the primary and secondary loading messages', () => {
    render(<Loading />);
    expect(screen.getByText('Loading the collective...')).toBeInTheDocument();
    expect(screen.getByText('Fetching contributor data from GitHub')).toBeInTheDocument();
  });

  it('renders the spinning ring with the correct Tailwind animation class', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
    expect(spinner).toHaveClass('rounded-full');
    expect(spinner).toHaveClass('border-t-cyan-400');
  });

  it('renders the pulsing glow element behind the spinner', () => {
    const { container } = render(<Loading />);
    const glow = container.querySelector('.animate-pulse');
    expect(glow).not.toBeNull();
    // The glow must be absolutely positioned so it overlays the ring
    expect(glow).toHaveClass('absolute');
  });

  it('spinner and glow share the same 16x16 (h-16 w-16) dimensions', () => {
    const { container } = render(<Loading />);
    const elements = container.querySelectorAll('.h-16.w-16');
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });

  it('outermost wrapper uses full-viewport dark background layout', () => {
    const { container } = render(<Loading />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('min-h-screen');
    expect(root).toHaveClass('bg-[#050505]');
    expect(root).toHaveClass('flex');
    expect(root).toHaveClass('items-center');
    expect(root).toHaveClass('justify-center');
  });

  it('component contains no focusable interactive elements (purely informational)', () => {
    const { container } = render(<Loading />);
    const focusable = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBe(0);
  });

  it('primary message uses light typography appropriate for a dark background', () => {
    render(<Loading />);
    const primary = screen.getByText('Loading the collective...');
    expect(primary.tagName.toLowerCase()).toBe('p');
    expect(primary).toHaveClass('text-zinc-400');
  });

  it('secondary message is rendered in monospace font for a technical feel', () => {
    render(<Loading />);
    const secondary = screen.getByText('Fetching contributor data from GitHub');
    expect(secondary).toHaveClass('font-mono');
  });
});
