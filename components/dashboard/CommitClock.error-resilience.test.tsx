import { render, screen } from '@testing-library/react';
import type { ReactNode, SVGProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import CommitClock, { findPeakIndex } from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

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
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    g: ({ children, ...props }: SVGProps<SVGGElement> & { children?: ReactNode }) => (
      <g {...props}>{children}</g>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const mockData: CommitClockData[] = [
  { day: 'Mon', commits: 2 },
  { day: 'Tue', commits: 5 },
  { day: 'Wed', commits: 1 },
  { day: 'Thu', commits: 3 },
  { day: 'Fri', commits: 4 },
  { day: 'Sat', commits: 2 },
  { day: 'Sun', commits: 1 },
];

describe('CommitClock Error Resilience', () => {
  it('renders safely with empty data', () => {
    render(<CommitClock data={[]} />);

    expect(screen.getByText(/no recent activity to display/i)).toBeInTheDocument();
  });

  it('renders fallback when all commit values are zero', () => {
    const zeroData: CommitClockData[] = [
      { day: 'Mon', commits: 0 },
      { day: 'Tue', commits: 0 },
      { day: 'Wed', commits: 0 },
      { day: 'Thu', commits: 0 },
      { day: 'Fri', commits: 0 },
      { day: 'Sat', commits: 0 },
      { day: 'Sun', commits: 0 },
    ];

    render(<CommitClock data={zeroData} />);

    expect(screen.getByText(/no recent activity to display/i)).toBeInTheDocument();
  });

  it('findPeakIndex safely handles empty arrays', () => {
    expect(findPeakIndex([])).toBe(0);
  });

  it('findPeakIndex returns highest commit day index', () => {
    expect(findPeakIndex(mockData)).toBe(1);
  });

  it('renders all weekday spokes without runtime failures', () => {
    render(<CommitClock data={mockData} />);

    const spokes = screen.getAllByRole('img');

    expect(spokes).toHaveLength(mockData.length);
  });
});
