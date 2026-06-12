import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import type React from 'react';

import CommitClock, { findPeakIndex } from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

// Mock framer-motion to prevent animation issues during testing
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    g: ({ children }: { children: ReactNode }) => <g>{children}</g>,
  },
}));

describe('CommitClock', () => {
  // Helper function for generating mock weekly data
  const generateMockData = (commits: number): CommitClockData[] => [
    { day: 'Sun', commits },
    { day: 'Mon', commits },
    { day: 'Tue', commits },
    { day: 'Wed', commits },
    { day: 'Thu', commits },
    { day: 'Fri', commits },
    { day: 'Sat', commits },
  ];

  it("renders 'Commit Clock' heading", () => {
    render(<CommitClock data={generateMockData(5)} />);

    expect(screen.getByRole('heading', { name: /commit clock/i })).toBeDefined();
  });

  it("renders 'Weekly activity cycle' subtitle", () => {
    render(<CommitClock data={generateMockData(5)} />);

    expect(screen.getByText(/weekly activity cycle/i)).toBeDefined();
  });

  it('renders all 7 day labels', () => {
    render(<CommitClock data={generateMockData(5)} />);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    days.forEach((day) => {
      expect(screen.getByText(day)).toBeDefined();
    });
  });

  it('renders an SVG element', () => {
    const { container } = render(<CommitClock data={generateMockData(5)} />);

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders with all-zero commit data without crashing', () => {
    expect(() => render(<CommitClock data={generateMockData(0)} />)).not.toThrow();
  });
});

describe('findPeakIndex', () => {
  it('returns 0 for a single item', () => {
    const data: CommitClockData[] = [
      {
        day: 'Mon',
        commits: 5,
      },
    ];

    expect(findPeakIndex(data)).toBe(0);
  });

  it('returns first index when all values are equal', () => {
    const data: CommitClockData[] = [
      {
        day: 'Mon',
        commits: 3,
      },
      {
        day: 'Tue',
        commits: 3,
      },
      {
        day: 'Wed',
        commits: 3,
      },
    ];

    expect(findPeakIndex(data)).toBe(0);
  });

  it('returns index of clear winner', () => {
    const data: CommitClockData[] = [
      {
        day: 'Mon',
        commits: 1,
      },
      {
        day: 'Tue',
        commits: 8,
      },
      {
        day: 'Wed',
        commits: 2,
      },
    ];

    expect(findPeakIndex(data)).toBe(1);
  });

  it('returns first index when all commits are zero', () => {
    const data: CommitClockData[] = [
      {
        day: 'Mon',
        commits: 0,
      },
      {
        day: 'Tue',
        commits: 0,
      },
      {
        day: 'Wed',
        commits: 0,
      },
    ];

    expect(findPeakIndex(data)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(findPeakIndex([])).toBe(0);
  });
});
