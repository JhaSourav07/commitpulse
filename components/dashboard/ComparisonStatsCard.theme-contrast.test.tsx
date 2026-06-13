import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import ComparisonStatsCard from './ComparisonStatsCard';

type MockMotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
  },
}));

const defaultProps = {
  title: 'Total Commits',
  valueA: 120,
  valueB: 80,
  labelA: 'userA',
  labelB: 'userB',
  icon: 'Flame',
};

describe('ComparisonStatsCard — Theme & Color Cohesion', () => {
  it('renders light and dark mode surface and border classes on card container', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    expect(container.innerHTML).toContain('bg-white');
    expect(container.innerHTML).toContain('dark:bg-[#0a0a0a]');
    expect(container.innerHTML).toContain('border-black/10');
    expect(container.innerHTML).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('applies emerald winner color and progress bar in both light and dark modes', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    expect(container.innerHTML).toContain('text-emerald-600');
    expect(container.innerHTML).toContain('dark:text-emerald-400');
    expect(container.innerHTML).toContain('bg-emerald-500');
    expect(container.innerHTML).toContain('dark:bg-emerald-400');
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('applies zinc progress bar classes for losing side in both themes', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    expect(container.innerHTML).toContain('bg-zinc-400');
    expect(container.innerHTML).toContain('dark:bg-zinc-600');
  });

  it('applies readable text color classes to value and label elements', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    expect(container.innerHTML).toContain('text-gray-900');
    expect(container.innerHTML).toContain('dark:text-white');
    expect(container.innerHTML).toContain('text-[#A1A1AA]');
  });

  it('foreground content remains visible inside overflow-hidden container', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    const overflowContainer = container.querySelector('.overflow-hidden');

    expect(overflowContainer).toBeInTheDocument();
    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('userA')).toBeInTheDocument();
  });
});
