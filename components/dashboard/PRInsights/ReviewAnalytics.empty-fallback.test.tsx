import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ReviewAnalytics from './ReviewAnalytics';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const emptyAnalytics = {
  reviewsGiven: 0,
  reviewsReceived: 0,
  fastestReview: 0,
  slowestReview: 0,
} as never;

const extremeAnalytics = {
  reviewsGiven: 999999,
  reviewsReceived: 888888,
  fastestReview: 0.1,
  slowestReview: 99999.9,
} as never;

describe('ReviewAnalytics Empty/Missing Inputs Verification', () => {
  it('renders successfully with zero-value analytics without crashing', () => {
    render(<ReviewAnalytics data={emptyAnalytics} />);

    expect(screen.getByText('Review Analytics')).toBeInTheDocument();
    expect(screen.getByText('Peer review participation and speed')).toBeInTheDocument();

    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getAllByText('0.0')[0]).toBeInTheDocument();
  });

  it('renders all metric sections when analytics values are empty-like defaults', () => {
    render(<ReviewAnalytics data={emptyAnalytics} />);

    expect(screen.getByText('Reviews Given')).toBeInTheDocument();
    expect(screen.getByText('Reviews Received')).toBeInTheDocument();
    expect(screen.getByText('Fastest Review')).toBeInTheDocument();
    expect(screen.getByText('Slowest Review')).toBeInTheDocument();
  });

  it('maintains layout structure when displaying default boundary values', () => {
    const { container } = render(<ReviewAnalytics data={emptyAnalytics} />);

    expect(container.querySelector('.grid.grid-cols-2')).toBeInTheDocument();

    expect(container.querySelector('.rounded-3xl')).toBeInTheDocument();
  });

  it('formats decimal review timing values correctly for boundary inputs', () => {
    render(
      <ReviewAnalytics
        data={
          {
            reviewsGiven: 0,
            reviewsReceived: 0,
            fastestReview: 1.23456,
            slowestReview: 9.87654,
          } as never
        }
      />
    );

    expect(screen.getByText('1.2')).toBeInTheDocument();
    expect(screen.getByText('9.9')).toBeInTheDocument();

    expect(screen.getAllByText('hrs')).toHaveLength(2);
  });

  it('renders extreme analytics values without breaking the DOM structure', () => {
    render(<ReviewAnalytics data={extremeAnalytics} />);

    expect(screen.getByText('999999')).toBeInTheDocument();
    expect(screen.getByText('888888')).toBeInTheDocument();
    expect(screen.getByText('0.1')).toBeInTheDocument();
    expect(screen.getByText('99999.9')).toBeInTheDocument();
  });
});
