import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommitClock from './CommitClock';
import { vi } from 'vitest';
import type { ReactNode, SVGProps, HTMLAttributes } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),

    g: ({ children, ...props }: SVGProps<SVGGElement> & { children?: ReactNode }) => (
      <g {...props}>{children}</g>
    ),
  },

  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));
describe('CommitClock - Empty Fallback', () => {
  it('renders fallback UI when data array is empty', () => {
    render(<CommitClock data={[]} />);

    expect(screen.getByText(/No recent activity to display/i)).toBeInTheDocument();
  });

  it('renders title and subtitle with empty data', () => {
    render(<CommitClock data={[]} />);

    expect(screen.getByText('Commit Clock')).toBeInTheDocument();
    expect(screen.getByText('Weekly activity cycle')).toBeInTheDocument();
  });

  it('does not render svg when no activity data exists', () => {
    const { container } = render(<CommitClock data={[]} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders cycle indicator even in fallback state', () => {
    render(<CommitClock data={[]} />);

    expect(screen.getByText('CYCLE')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
  });

  it('shows fallback UI when all commit counts are zero', () => {
    render(
      <CommitClock
        data={[
          { day: 'Mon', commits: 0 },
          { day: 'Tue', commits: 0 },
          { day: 'Wed', commits: 0 },
          { day: 'Thu', commits: 0 },
          { day: 'Fri', commits: 0 },
          { day: 'Sat', commits: 0 },
          { day: 'Sun', commits: 0 },
        ]}
      />
    );

    expect(screen.getByText(/No recent activity to display/i)).toBeInTheDocument();
  });
});
