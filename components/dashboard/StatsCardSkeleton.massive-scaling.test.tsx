import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import StatsCardSkeleton from './StatsCardSkeleton';

describe('StatsCardSkeleton - Massive Data Scaling', () => {
  test('should preserve structure across 1000 parallel instances', () => {
    const count = 1000;
    const { container } = render(
      <div>
        {Array.from({ length: count }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );

    expect(container.querySelectorAll('.overflow-hidden')).toHaveLength(count);
    expect(container.querySelectorAll('.space-y-3')).toHaveLength(count);
  });

  test('should render correct shimmer node counts under massive grid load', () => {
    const cardsCount = 500;
    const { container } = render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: cardsCount }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );

    // 3 text placeholders + 1 icon placeholder + 12 chart bars = 16 shimmer nodes per card
    // 500 cards * 16 shimmers = 8000 total nodes
    expect(container.querySelectorAll('.shimmer')).toHaveLength(cardsCount * 16);
  });

  test('should scale micro-chart elements linearly with dataset size', () => {
    const count = 1000;
    const { container } = render(
      <div>
        {Array.from({ length: count }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );

    // 1000 cards * 12 chart bars = 12000 total column nodes
    expect(container.querySelectorAll('.flex-1.shimmer')).toHaveLength(count * 12);
  });

  test('should render exact deterministic chart heights matching specifications', () => {
    const { container } = render(<StatsCardSkeleton />);

    const expectedHeights = [
      '24%',
      '32%',
      '18%',
      '45%',
      '38%',
      '52%',
      '28%',
      '42%',
      '35%',
      '48%',
      '30%',
      '22%',
    ];
    const chartBars = container.querySelectorAll('.flex-1.shimmer');

    expect(chartBars).toHaveLength(expectedHeights.length);

    chartBars.forEach((bar, index) => {
      const htmlElement = bar as HTMLElement;
      expect(htmlElement.style.height).toBe(expectedHeights[index]);
    });
  });

  test('should maintain node tree integrity when deeply nested', () => {
    const nestedCount = 10;

    const { container } = render(
      <div className="super-wrapper-grid">
        <div className="sub-wrapper-flex">
          <section className="inner-dashboard-panel">
            {Array.from({ length: nestedCount }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </section>
        </div>
      </div>
    );

    const parentContainer = container.querySelector('.inner-dashboard-panel');
    expect(parentContainer).not.toBeNull();
    expect(parentContainer?.querySelectorAll('.overflow-hidden')).toHaveLength(nestedCount);
  });
});
