import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CommitClock from './CommitClock';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(
          ([key]) =>
            !['initial', 'animate', 'whileInView', 'viewport', 'transition', 'exit'].includes(key)
        )
      ) as React.HTMLAttributes<HTMLDivElement>;

      return <div {...domProps}>{children}</div>;
    },
    g: ({ children, ...props }: React.SVGProps<SVGGElement>) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CommitClock - Massive Scaling', () => {
  const hugeDataset = Array.from({ length: 7000 }, (_, i) => ({
    day: `Day-${i}`,
    commits: i + 1,
  }));

  it('renders successfully with thousands of records', () => {
    const { container } = render(<CommitClock data={hugeDataset} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles extremely large commit counts', () => {
    const data = [
      { day: 'Mon', commits: Number.MAX_SAFE_INTEGER },
      { day: 'Tue', commits: Number.MAX_SAFE_INTEGER - 1 },
      { day: 'Wed', commits: Number.MAX_SAFE_INTEGER - 2 },
      { day: 'Thu', commits: Number.MAX_SAFE_INTEGER - 3 },
      { day: 'Fri', commits: Number.MAX_SAFE_INTEGER - 4 },
      { day: 'Sat', commits: Number.MAX_SAFE_INTEGER - 5 },
      { day: 'Sun', commits: Number.MAX_SAFE_INTEGER - 6 },
    ];

    const { container } = render(<CommitClock data={data} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders all weekday labels under heavy values', () => {
    render(
      <CommitClock
        data={[
          { day: 'Mon', commits: 999999 },
          { day: 'Tue', commits: 888888 },
          { day: 'Wed', commits: 777777 },
          { day: 'Thu', commits: 666666 },
          { day: 'Fri', commits: 555555 },
          { day: 'Sat', commits: 444444 },
          { day: 'Sun', commits: 333333 },
        ]}
      />
    );

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('bounds rendered weekday spokes for large datasets without crashing', () => {
    const { container } = render(<CommitClock data={hugeDataset} />);

    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(container.querySelectorAll('g[role="img"]')).toHaveLength(7);
    expect(container.querySelectorAll('line')).toHaveLength(42);
  });

  it('shows tooltip data from the bounded weekday cycle', () => {
    render(<CommitClock data={hugeDataset} />);

    fireEvent.focus(screen.getByRole('img', { name: 'Day-0: 1 contribution' }));

    expect(screen.getByRole('tooltip')).toHaveTextContent('Day-0 activity');
    expect(screen.getByRole('tooltip')).toHaveTextContent('1 contribution');
  });

  it('renders within acceptable execution time for large input', () => {
    const start = performance.now();

    render(<CommitClock data={hugeDataset} />);

    const end = performance.now();

    expect(end - start).toBeLessThan(5000);
  });
});
