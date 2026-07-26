import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode, HTMLAttributes } from 'react';
import { describe, it, expect, vi } from 'vitest';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

vi.mock('./VisualizationTooltip', () => ({
  default: ({ title, children }: { title: string; children?: ReactNode }) => (
    <div data-testid="tooltip">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const mockData: ActivityData[] = [
  {
    date: '2025-01-01',
    count: 12,
    intensity: 3,
    locAdditions: 20,
    locDeletions: 5,
  },
];

describe('ActivityLandscape Accessibility', () => {
  it('renders chart with accessible role and aria-label', () => {
    render(<ActivityLandscape data={mockData} />);

    expect(
      screen.getByRole('img', {
        name: /activity chart showing contribution frequency over time/i,
      })
    ).toBeInTheDocument();
  });

  it('renders all interactive controls as accessible buttons', () => {
    render(<ActivityLandscape data={mockData} />);

    expect(screen.getByRole('button', { name: 'Commits' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Lines of Code' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '1W' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
  });

  it('allows keyboard focus on activity bars', async () => {
    const user = userEvent.setup();

    render(<ActivityLandscape data={mockData} />);

    await user.tab();

    const activityBar = screen.getByLabelText(/contributions|lines modified/i);

    expect(activityBar).toHaveAttribute('tabindex', '0');
  });

  it('activity bars provide screen-reader friendly descriptions', () => {
    render(<ActivityLandscape data={mockData} />);

    expect(screen.getByLabelText(/on january|contributions|lines modified/i)).toBeInTheDocument();
  });

  it('contains a logical heading hierarchy', () => {
    render(<ActivityLandscape data={mockData} />);

    expect(
      screen.getByRole('heading', {
        name: /activity landscape/i,
      })
    ).toBeInTheDocument();
  });
});
