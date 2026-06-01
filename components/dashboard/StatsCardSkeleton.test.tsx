import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import StatsCardSkeleton from './StatsCardSkeleton';

describe('StatsCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<StatsCardSkeleton />);

    expect(container).toBeDefined();
  });

  it('renders exactly 12 chart bar elements', () => {
    const { container } = render(<StatsCardSkeleton />);

    const bars = container.querySelectorAll('.rounded-t-\\[1px\\]');

    expect(bars.length).toBe(12);
  });

  it('renders shimmer class on all chart bars', () => {
    const { container } = render(<StatsCardSkeleton />);

    const bars = container.querySelectorAll('.rounded-t-\\[1px\\]');

    bars.forEach((bar) => {
      expect(bar.className).toContain('shimmer');
    });
  });

  it('matches snapshot without random variation', () => {
    const { container } = render(<StatsCardSkeleton />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
