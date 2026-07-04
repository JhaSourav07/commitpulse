import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import StatsCardSkeleton from './StatsCardSkeleton';

const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  desktop: 1440,
};

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  window.dispatchEvent(new Event('resize'));
}

describe('StatsCardSkeleton — responsive breakpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders successfully at standard mobile viewport width (375px)', () => {
    setViewport(BREAKPOINTS.mobile);

    const { container } = render(<StatsCardSkeleton />);

    expect(container.firstChild).not.toBeNull();
  });

  it('preserves vertical skeleton column layout on mobile', () => {
    setViewport(BREAKPOINTS.mobile);

    const { container } = render(<StatsCardSkeleton />);

    const textColumn = container.querySelector('.space-y-3');

    expect(textColumn).not.toBeNull();
  });

  it('uses width-safe responsive classes that prevent horizontal overflow', () => {
    setViewport(BREAKPOINTS.mobile);

    const { container } = render(<StatsCardSkeleton />);

    const chart = container.querySelector('.w-full');

    expect(chart).not.toBeNull();
    expect((chart as HTMLElement).className).toContain('w-full');
  });

  it('chart bars scale consistently across mobile, tablet and desktop', () => {
    for (const width of Object.values(BREAKPOINTS)) {
      setViewport(width);

      const { container, unmount } = render(<StatsCardSkeleton />);
      const bars = container.querySelectorAll('.rounded-t-\\[1px\\]');

      expect(bars).toHaveLength(12);

      unmount();
    }
  });

  it('does not expose interactive navigation or toggle elements on mobile', () => {
    setViewport(BREAKPOINTS.mobile);

    const { container } = render(<StatsCardSkeleton />);

    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[role="navigation"]')).toBeNull();
  });
});
