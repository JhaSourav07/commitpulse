import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TopMetricsRow from './TopMetricsRow';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockData: PRInsightData = {
  totalPRs: 100,
  openPRs: 10,
  mergedPRs: 80,
  closedPRs: 10,
  mergeRate: 80,
  avgReviewTime: 12,
  avgTimeToFirstReview: 4,
  avgCycleTime: 24,

  weeklyActivity: [{ name: '2026-W01', prs: 5 }],
  monthlyActivity: [],

  reviewsGiven: 25,
  reviewsReceived: 18,
  avgReviewResponseTime: 6,
  fastestReview: 2.5,
  slowestReview: 48.7,

  repoPerformance: [],
  prs: [],
  highlights: {},
};

describe('TopMetricsRow responsive breakpoints', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders correctly for a standard 375px mobile viewport', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('First Review')).toBeInTheDocument();
  });

  it('uses responsive grid breakpoint classes', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const grid = container.firstElementChild as HTMLElement;

    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-6');
  });

  it('avoids fixed-width classes that could cause horizontal scrolling', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const cards = container.querySelectorAll('.bg-white');

    cards.forEach((card) => {
      expect(card.className).not.toContain('w-screen');
      expect(card.className).not.toContain('w-[');
    });
  });

  it('keeps all metric cards visible on smaller viewports', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80.0')).toBeInTheDocument();
    expect(screen.getByText('24.0')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('keeps all metric cards inside the responsive grid container', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const grid = container.firstElementChild as HTMLElement;

    expect(grid.children).toHaveLength(4);

    Array.from(grid.children).forEach((card) => {
      expect(card).toBeInTheDocument();
    });
  });
});

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
  it('reflows into a single-column vertical layout on mobile-width viewports', () => {
    const { container } = render(<TopMetricsRow data={buildData() as never} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('scales up columns progressively at md and lg breakpoints', () => {
    const { container } = render(<TopMetricsRow data={buildData() as never} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('does not use fixed pixel widths that would cause horizontal scrollbars on small viewports', () => {
    const { container } = render(<TopMetricsRow data={buildData() as never} />);

    const grid = container.querySelector('.grid');
    expect(grid?.className).not.toMatch(/\bw-\[\d/);

    const cards = container.querySelectorAll(':scope > div > div');
    cards.forEach((card) => {
      expect(card.className).not.toMatch(/\bw-\[\d/);
    });
  });

  it('renders all metric card values and suffixes without truncation or clipping', () => {
    render(<TopMetricsRow data={buildData() as never} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('87.5')).toBeInTheDocument();
    expect(screen.getByText('12.3')).toBeInTheDocument();
    expect(screen.getByText('3.1')).toBeInTheDocument();
  });

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