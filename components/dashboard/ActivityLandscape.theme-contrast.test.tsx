import { render, screen } from '@testing-library/react';
import type { ReactNode, HTMLAttributes } from 'react';
import { describe, it, expect, vi } from 'vitest';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

vi.mock('./VisualizationTooltip', () => ({
  default: ({ children }: { children?: ReactNode }) => <div data-testid="tooltip">{children}</div>,
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
    locAdditions: 25,
    locDeletions: 5,
  },
];

describe('ActivityLandscape Theme Contrast', () => {
  it('renders successfully in light theme', () => {
    document.documentElement.classList.remove('dark');

    render(<ActivityLandscape data={mockData} />);

    expect(
      screen.getByRole('img', {
        name: /activity chart showing contribution frequency over time/i,
      })
    ).toBeInTheDocument();
  });

  it('renders successfully in dark theme', () => {
    document.documentElement.classList.add('dark');

    render(<ActivityLandscape data={mockData} />);

    expect(
      screen.getByRole('img', {
        name: /activity chart showing contribution frequency over time/i,
      })
    ).toBeInTheDocument();
  });

  it('contains dark mode utility classes on root container', () => {
    const { container } = render(<ActivityLandscape data={mockData} />);

    const root = container.querySelector('.dark\\:bg-\\[\\#0a0a0a\\]');

    expect(root).toBeTruthy();
  });

  it('contains dark mode text contrast classes', () => {
    render(<ActivityLandscape data={mockData} />);

    expect(screen.getByText('Activity Landscape')).toHaveClass('text-gray-900', 'dark:text-white');
  });

  it('preserves chart accessibility in both themes', () => {
    render(<ActivityLandscape data={mockData} />);

    const chart = screen.getByRole('img');

    expect(chart).toHaveAttribute(
      'aria-label',
      'Activity chart showing contribution frequency over time'
    );
  });
});
