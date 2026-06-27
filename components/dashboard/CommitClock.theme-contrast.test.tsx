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

vi.mock('./VisualizationTooltip', () => ({
  default: () => <div>Tooltip</div>,
}));

describe('CommitClock - Theme Contrast', () => {
  const data = [
    { day: 'Mon', commits: 10 },
    { day: 'Tue', commits: 20 },
    { day: 'Wed', commits: 30 },
    { day: 'Thu', commits: 40 },
    { day: 'Fri', commits: 50 },
    { day: 'Sat', commits: 60 },
    { day: 'Sun', commits: 70 },
  ];

  it('renders light and dark mode container classes', () => {
    const { container } = render(<CommitClock data={data} />);

    const wrapper = container.querySelector('.bg-white');

    expect(wrapper).toHaveClass('bg-white');
    expect(wrapper).toHaveClass('dark:bg-[#0a0a0a]');
  });

  it('renders title and subtitle with theme-aware classes', () => {
    render(<CommitClock data={data} />);

    expect(screen.getByText('Commit Clock')).toBeInTheDocument();
    expect(screen.getByText('Weekly activity cycle')).toBeInTheDocument();
  });

  it('renders SVG style block containing dark mode variables', () => {
    const { container } = render(<CommitClock data={data} />);

    const styleTag = container.querySelector('style');

    expect(styleTag?.textContent).toContain('--peak-spoke');
    expect(styleTag?.textContent).toContain('.dark');
    expect(styleTag?.textContent).toContain('--peak-label');
  });

  it('renders SVG visualization in active state', () => {
    const { container } = render(<CommitClock data={data} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders center cycle indicator consistently across themes', () => {
    render(<CommitClock data={data} />);

    expect(screen.getByText('CYCLE')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
  });
});
