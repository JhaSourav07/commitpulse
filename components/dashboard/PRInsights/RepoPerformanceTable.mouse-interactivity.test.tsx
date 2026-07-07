import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import RepoPerformanceTable from './RepoPerformanceTable';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({
          children,
          animate,
          initial,
          exit,
          transition,
          whileHover,
          whileTap,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => React.createElement(tag as string, props, children);
      },
    }
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function makeData(
  repos: { name: string; totalPRs: number; mergeRate: number; reviewCount: number }[]
): PRInsightData {
  return {
    repoPerformance: repos,
    totalPRs: 0,
    mergedPRs: 0,
    openPRs: 0,
    closedPRs: 0,
    avgMergeTime: 0,
    avgReviewCount: 0,
    reviewParticipation: 0,
    prVelocity: [],
    reviewerStats: [],
    labels: [],
    sizeDistribution: { small: 0, medium: 0, large: 0, xl: 0 },
    codingHours: { morning: 0, afternoon: 0, evening: 0, night: 0 },
  } as unknown as PRInsightData;
}

const mockRepos = [
  { name: 'subho/commitpulse', totalPRs: 42, mergeRate: 78.5, reviewCount: 15 },
  { name: 'subho/streakforge', totalPRs: 18, mergeRate: 55.0, reviewCount: 7 },
  { name: 'subho/taskflow', totalPRs: 9, mergeRate: 100.0, reviewCount: 3 },
];

describe('RepoPerformanceTable - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('triggers mouseenter and mouseleave on a table row without throwing and applies hover transition class', () => {
    render(<RepoPerformanceTable data={makeData(mockRepos)} />);

    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    const firstRow = rows[0] as HTMLElement;

    // Row must carry the transition-colors class for CSS hover behavior
    expect(firstRow).toHaveClass('transition-colors');
    expect(firstRow).toHaveClass('group');

    // mouseenter and mouseleave must not throw
    expect(() => fireEvent.mouseEnter(firstRow)).not.toThrow();
    expect(() => fireEvent.mouseLeave(firstRow)).not.toThrow();
  });

  it('exposes a native title tooltip on the repo name cell matching the full repo path', () => {
    render(<RepoPerformanceTable data={makeData(mockRepos)} />);

    // Each repo name div carries title= with the full "owner/repo" string
    const tooltips = document.querySelectorAll('[title]');
    expect(tooltips.length).toBe(mockRepos.length);

    expect(tooltips[0]).toHaveAttribute('title', 'subho/commitpulse');
    expect(tooltips[1]).toHaveAttribute('title', 'subho/streakforge');
    expect(tooltips[2]).toHaveAttribute('title', 'subho/taskflow');
  });

  it('propagates touch events on table rows without being prevented', () => {
    render(<RepoPerformanceTable data={makeData(mockRepos)} />);

    const rows = document.querySelectorAll('tbody tr');

    // touchStart must propagate — returns true when not explicitly prevented
    expect(fireEvent.touchStart(rows[0])).toBe(true);
    expect(fireEvent.touchEnd(rows[0])).toBe(true);
    expect(fireEvent.touchStart(rows[1])).toBe(true);
    expect(fireEvent.touchEnd(rows[1])).toBe(true);
  });

  it('renders merge rate progress bar with correct inline width style reflecting the data value', () => {
    render(<RepoPerformanceTable data={makeData(mockRepos)} />);

    // The cyan progress bar uses inline style width matching mergeRate
    const bars = document.querySelectorAll('.bg-cyan-500.rounded-full');
    expect(bars.length).toBe(mockRepos.length);

    expect((bars[0] as HTMLElement).style.width).toBe('78.5%');
    expect((bars[1] as HTMLElement).style.width).toBe('55%');
    expect((bars[2] as HTMLElement).style.width).toBe('100%');
  });

  it('renders the empty fallback state when repoPerformance is an empty array', () => {
    render(<RepoPerformanceTable data={makeData([])} />);

    // No table should be present in the fallback state
    expect(document.querySelector('table')).not.toBeInTheDocument();

    // Fallback paragraph must be visible
    expect(screen.getByText('dashboard.prInsights.no_repos')).toBeInTheDocument();
  });
});
