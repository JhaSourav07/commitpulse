import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AIInsightsSkeleton from './AIInsightsSkeleton';

describe('AIInsightsSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<AIInsightsSkeleton />);

    expect(container.firstChild).toBeTruthy();
  });

  it('renders exactly 3 insight skeleton rows', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const rows = container.querySelectorAll('.flex.items-start.gap-3');

    expect(rows).toHaveLength(3);
  });

  it('renders shimmer elements inside each insight row', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const rows = container.querySelectorAll('.flex.items-start.gap-3');

    rows.forEach((row) => {
      expect(row.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
    });
  });

  it('renders icon shimmer and text shimmer blocks for each row', () => {
    const { container } = render(<AIInsightsSkeleton />);

    const rows = container.querySelectorAll('.flex.items-start.gap-3');

    rows.forEach((row) => {
      const iconShimmer = row.querySelector('.w-4.h-4.shimmer.rounded-full');
      const textShimmers = row.querySelectorAll('.h-3.shimmer.rounded');

      expect(iconShimmer).toBeTruthy();
      expect(textShimmers).toHaveLength(2);
    });
  });
});
