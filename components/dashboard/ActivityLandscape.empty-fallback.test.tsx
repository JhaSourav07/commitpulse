import { render, screen } from '@testing-library/react';
import type { ActivityData } from '@/types/dashboard';
import { describe, it, expect, vi } from 'vitest';
import ActivityLandscape, { getFilteredData } from './ActivityLandscape';
import type { ReactNode, HTMLAttributes } from 'react';

// Mock tooltip component
vi.mock('./VisualizationTooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

// Mock framer-motion

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('ActivityLandscape - Empty Fallback', () => {
  it('renders successfully with an empty data array', () => {
    render(<ActivityLandscape data={[]} />);

    expect(screen.getByText('Activity Landscape')).toBeInTheDocument();

    expect(
      screen.getByRole('img', {
        name: /activity chart showing contribution frequency over time/i,
      })
    ).toBeInTheDocument();
  });

  it('renders graph container without crashing when no bars exist', () => {
    const { container } = render(<ActivityLandscape data={[]} />);

    const chart = screen.getByRole('img');

    expect(chart).toBeInTheDocument();

    const bars = container.querySelectorAll('[tabindex="0"]');

    expect(bars.length).toBe(0);
  });

  it('getFilteredData returns empty array for empty input', () => {
    expect(getFilteredData([], '1W')).toEqual([]);
    expect(getFilteredData([], '1M')).toEqual([]);
    expect(getFilteredData([], '3M')).toEqual([]);
    expect(getFilteredData([], '1Y')).toEqual([]);
  });

  it('renders safely when activity counts are all zero', () => {
    const mockData: ActivityData[] = [
      {
        date: '2025-01-01',
        count: 0,
        intensity: 0,
        locAdditions: 0,
        locDeletions: 0,
      },
    ];

    render(<ActivityLandscape data={mockData} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('maintains accessibility attributes in empty state', () => {
    render(<ActivityLandscape data={[]} />);

    const chart = screen.getByRole('img');

    expect(chart).toHaveAttribute(
      'aria-label',
      'Activity chart showing contribution frequency over time'
    );
  });
});
