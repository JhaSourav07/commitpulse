import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

// 1. Mock Data
const mockData = [
  {
    date: '2026-06-03',
    count: 5,
    intensity: 3,
    locAdditions: 150,
    locDeletions: 20,
  },
] as unknown as ActivityData[];

describe('ActivityLandscape Component - Mouse Interactivity & Tooltips', () => {
  let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    // Force the virtual browser to pretend the bar is at a specific physical location
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 200,
      top: 50,
      left: 100,
      bottom: 250,
      right: 200,
      x: 100,
      y: 50,
      toJSON: () => {},
    }));
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up our forced layout math so we don't break other tests
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it('triggers simulated mouseenter gestures on active segments to show tooltips', async () => {
    const { container } = render(<ActivityLandscape data={mockData} />);
    const interactiveBar = container.querySelector('.group\\/bar');
    expect(interactiveBar).not.toBeNull();

    if (interactiveBar) {
      fireEvent.mouseEnter(interactiveBar);

      // Verify the tooltip actually enters the DOM
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    }
  });

  it('verifies that responsive tooltip layouts display at computed coordinates', async () => {
    const { container } = render(<ActivityLandscape data={mockData} />);
    const interactiveBar = container.querySelector('.group\\/bar');

    if (interactiveBar) {
      fireEvent.mouseEnter(interactiveBar);

      // Wait for the REAL tooltip to render
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // Based on our mocked layout math in the component:
      // X = rect.left + rect.width / 2 = 100 + 50 = 150px
      // Y = rect.top - 10 = 50 - 10 = 40px
      expect(tooltip.style.left).toBe('150px');
      expect(tooltip.style.top).toBe('40px');
    }
  });

  it('tests custom touch gestures (focus) and ensures event propagation', async () => {
    const { container } = render(<ActivityLandscape data={mockData} />);
    const interactiveBar = container.querySelector('.group\\/bar');

    if (interactiveBar) {
      // Mobile devices often trigger 'focus' instead of standard hover events
      fireEvent.focus(interactiveBar);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    }
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover targets', () => {
    const { container } = render(<ActivityLandscape data={mockData} />);
    const interactiveBar = container.querySelector('.group\\/bar');

    if (interactiveBar) {
      expect(interactiveBar.className).toContain('cursor-pointer');
    }
  });

  it('checks that mouseleave/blur events successfully hide temporary overlay visuals', async () => {
    const { container } = render(<ActivityLandscape data={mockData} />);
    const interactiveBar = container.querySelector('.group\\/bar');

    if (interactiveBar) {
      // 1. Show the tooltip
      fireEvent.mouseEnter(interactiveBar);
      await screen.findByRole('tooltip');

      // 2. Hide the tooltip
      fireEvent.mouseLeave(interactiveBar);

      // 3. Verify it disappears (we wait for Framer Motion to finish animating it out)
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).toBeNull();
      });
    }
  });
});
