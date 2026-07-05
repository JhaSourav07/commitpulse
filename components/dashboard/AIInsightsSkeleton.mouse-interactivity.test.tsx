import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AIInsightsSkeleton from './AIInsightsSkeleton';

describe('AIInsightsSkeleton - Interactive Tooltips, Cursor Hovers & Touch Event Propagation (Variation 5)', () => {
  it('triggers simulated mouseenter/hover gestures on skeleton elements', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);

    shimmerElements.forEach((element) => {
      expect(() => {
        fireEvent.mouseEnter(element);
        fireEvent.mouseOver(element);
      }).not.toThrow();
    });
  });

  it('does not render tooltips or overlays while hovering over the loading skeleton', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const firstShimmer = container.querySelector('.shimmer');
    expect(firstShimmer).not.toBeNull();
    if (!firstShimmer) return;

    fireEvent.mouseEnter(firstShimmer);

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('allows click and touch events to propagate correctly', () => {
    const clickSpy = vi.fn();
    const touchSpy = vi.fn();

    const { container } = render(
      <div onClick={clickSpy} onTouchStart={touchSpy}>
        <AIInsightsSkeleton />
      </div>
    );

    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);

    fireEvent.click(shimmerElements[0]);
    fireEvent.touchStart(shimmerElements[0]);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(touchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not apply interactive cursor classes to shimmer elements', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');

    shimmerElements.forEach((element) => {
      expect(element.className).not.toContain('cursor-pointer');
      expect(element.className).not.toContain('cursor-text');
    });
  });

  it('removes temporary hover visuals after mouse leaves', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const firstShimmer = container.querySelector('.shimmer');
    expect(firstShimmer).not.toBeNull();
    if (!firstShimmer) return;

    fireEvent.mouseEnter(firstShimmer);
    fireEvent.mouseLeave(firstShimmer);

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(container.querySelectorAll('.overlay, .tooltip')).toHaveLength(0);
  });
});
