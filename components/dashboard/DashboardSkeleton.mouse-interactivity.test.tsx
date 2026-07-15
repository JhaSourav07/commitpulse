import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

describe('DashboardSkeleton - Interactive Tooltips, Cursor Hovers & Touch Event Propagation (Variation 5)', () => {
  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    // Fulfills implementation step 1
    const { container } = render(<DashboardSkeleton />);

    // Select the main shimmer segments/boxes representing skeleton panels
    const segments = container.querySelectorAll('.shimmer');
    expect(segments.length).toBeGreaterThan(0);

    // Simulate hover/mouseenter gestures on these segments
    segments.forEach((segment) => {
      expect(() => {
        fireEvent.mouseEnter(segment);
        fireEvent.mouseOver(segment);
      }).not.toThrow();
    });
  });

  it('does not render tooltips/overlays in the loading skeleton state on hover', () => {
    // Skeleton state should suppress any tooltip/overlay UI
    const { container } = render(<DashboardSkeleton />);

    // Simulate mouseenter on a segment
    const firstShimmer = container.querySelector('.shimmer');
    expect(firstShimmer).not.toBeNull();
    if (!firstShimmer) return;
    fireEvent.mouseEnter(firstShimmer);

    // Verify that since it's a skeleton loading state, no responsive tooltips are rendered/displayed
    const tooltip = screen.queryByRole('tooltip');
    expect(tooltip).toBeNull();

    // Also verify no overlay element serving as a tooltip exists
    const tooltipOverlay = container.querySelector('[role="tooltip"]');
    expect(tooltipOverlay).toBeNull();
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly', () => {
    // Fulfills implementation step 3
    const clickSpy = vi.fn();
    const touchSpy = vi.fn();

    const { container } = render(
      <div onClick={clickSpy} onTouchStart={touchSpy}>
        <DashboardSkeleton />
      </div>
    );

    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);

    // Simulate click and touch events on a skeleton segment
    const testElement = shimmerElements[0];
    expect(testElement).toBeDefined();
    if (!testElement) return;
    fireEvent.click(testElement);
    fireEvent.touchStart(testElement);

    // Assert that the click and touch gestures correctly propagate to the parent wrapper
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(touchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not apply interactive cursor classes (cursor-pointer/cursor-text) to skeleton shimmer elements', () => {
    // Fulfills implementation step 4
    const { container } = render(<DashboardSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);

    // Skeletons are decorative, non-interactive visual containers;
    // thus, they must not have any interactive cursor pointers.
    shimmerElements.forEach((element) => {
      expect(element.className).not.toContain('cursor-pointer');
      expect(element.className).not.toContain('cursor-text');
    });
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    // Fulfills implementation step 5
    const { container } = render(<DashboardSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
    const firstShimmer = shimmerElements[0];
    expect(firstShimmer).toBeDefined();
    if (!firstShimmer) return;

    // Simulate entering then leaving
    fireEvent.mouseEnter(firstShimmer);
    fireEvent.mouseLeave(firstShimmer);

    // Verify that no tooltips or temporary loading overlays exist or remain visible
    const tooltip = screen.queryByRole('tooltip');
    expect(tooltip).toBeNull();

    const overlays = container.querySelectorAll('.overlay, .tooltip');
    expect(overlays.length).toBe(0);
  });
});
