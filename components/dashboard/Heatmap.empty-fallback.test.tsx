import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div
        className={props.className}
        style={props.style}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
      >
        {props.children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('Heatmap Empty Fallback', () => {
  const emptyData: ActivityData[] = [];

  const zeroContributionData: ActivityData[] = [
    {
      date: '2025-01-01',
      count: 0,
      intensity: 0,
    },
    {
      date: '2025-01-02',
      count: 0,
      intensity: 0,
    },
  ];

  it('renders default empty message when data array is empty', () => {
    render(<Heatmap data={emptyData} />);

    expect(screen.getByText(/No recent activity to display/i)).toBeInTheDocument();
  });

  it('renders custom empty message when provided', () => {
    render(<Heatmap data={emptyData} emptyMessage="Custom fallback message" />);

    expect(screen.getByText(/Custom fallback message/i)).toBeInTheDocument();
  });

  it('renders fallback UI when all contribution counts are zero', () => {
    render(<Heatmap data={zeroContributionData} />);

    expect(screen.getByText(/No recent activity to display/i)).toBeInTheDocument();
  });

  it('does not render heatmap grid when no activity exists', () => {
    render(<Heatmap data={emptyData} />);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('preserves title and subtitle in empty state', () => {
    render(<Heatmap data={emptyData} />);

    expect(screen.getByText(/Contribution Heatmap/i)).toBeInTheDocument();

    expect(screen.getByText(/Last 365 days/i)).toBeInTheDocument();
  });
});
