import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import TopMetricsRow from './TopMetricsRow';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

function buildData(overrides = {}) {
  return {
    totalPRs: 42,
    mergeRate: 87.5,
    avgCycleTime: 12.3,
    avgTimeToFirstReview: 3.1,
    weeklyActivity: [
      { name: 'W1', prs: 4 },
      { name: 'W2', prs: 9 },
    ],
    ...overrides,
  };
}

describe('TopMetricsRow responsive multi-device columns & mobile viewport layouts (Variation 7)', () => {
  // Case 1: Mobile-width layout — single column, reflowing into a standard vertical list.
  it('reflows into a single-column vertical layout on mobile-width viewports', () => {
    const { container } = render(<TopMetricsRow data={buildData() as never} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
  });

  // Case 2: Verify progressive breakpoints scale up column count at md and lg, not before.
  it('scales up columns progressively at md and lg breakpoints', () => {
    const { container } = render(<TopMetricsRow data={buildData() as never} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  // Case 3: No fixed/absolute pixel widths on the grid or cards that would force horizontal scrollbars.
  it('does not use fixed pixel widths that would cause horizontal scrollbars on small viewports', () => {
    const { container } = render(<TopMetricsRow data={buildData() as never} />);

    const grid = container.querySelector('.grid');
    expect(grid?.className).not.toMatch(/\bw-\[\d/);

    const cards = container.querySelectorAll(':scope > div > div');
    cards.forEach((card) => {
      expect(card.className).not.toMatch(/\bw-\[\d/);
    });
  });

  // Case 4: All four metric cards render their content fully at any viewport (no clipping/truncation classes).
  it('renders all metric card values and suffixes without truncation or clipping', () => {
    render(<TopMetricsRow data={buildData() as never} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('87.5')).toBeInTheDocument();
    expect(screen.getByText('12.3')).toBeInTheDocument();
    expect(screen.getByText('3.1')).toBeInTheDocument();
  });

  // Case 5: Responsive grid layout is retained after rerendering with different data (no layout collapse).
  it('preserves the responsive grid classes after rerendering with updated data', () => {
    const { container, rerender } = render(<TopMetricsRow data={buildData() as never} />);

    rerender(
      <TopMetricsRow
        data={buildData({ totalPRs: 100, weeklyActivity: [{ name: 'W1', prs: 20 }] }) as never}
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
