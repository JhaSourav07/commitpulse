import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import StatsCardSkeleton from './StatsCardSkeleton';

describe('StatsCardSkeleton - Empty/Missing Inputs Verification', () => {
  it('renders successfully without props', () => {
    const { container } = render(<StatsCardSkeleton />);

    expect(container.firstChild).not.toBeNull();
  });

  it('does not throw runtime errors during render', () => {
    expect(() => render(<StatsCardSkeleton />)).not.toThrow();
  });

  it('renders fallback chart bars', () => {
    const { container } = render(<StatsCardSkeleton />);

    const bars = container.querySelectorAll('.rounded-t-\\[1px\\]');

    expect(bars.length).toBe(12);
  });

  it('maintains default card layout styling', () => {
    const { container } = render(<StatsCardSkeleton />);

    const card = container.querySelector('.rounded-xl');

    expect(card).toBeTruthy();
  });

  it('renders expected DOM markers in fallback state', () => {
    const { container } = render(<StatsCardSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');

    expect(shimmerElements.length).toBeGreaterThan(0);
  });
});
