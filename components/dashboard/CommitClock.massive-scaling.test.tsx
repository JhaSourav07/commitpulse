import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommitClock from './CommitClock';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
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

  it('renders SVG spokes for large datasets without crashing', () => {
    const { container } = render(<CommitClock data={hugeDataset} />);

    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(container.querySelectorAll('line').length).toBeGreaterThan(0);
  });

  it('renders within acceptable execution time for large input', () => {
    const start = performance.now();

    render(<CommitClock data={hugeDataset} />);

    const end = performance.now();

    expect(end - start).toBeLessThan(5000);
  });
});
