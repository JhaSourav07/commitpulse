import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import GrowthTrendChart from './GrowthTrendChart';

type MotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionProps) => <div {...props}>{children}</div>,
    path: ({ children, ...props }: MotionProps) => <path {...props}>{children}</path>,
  },
}));

const mockActivity = [
  { date: '2026-01-01', count: 10 },
  { date: '2026-02-01', count: 15 },
  { date: '2026-03-01', count: 20 },
];

describe('GrowthTrendChart theme contrast', () => {
  const renderChart = () =>
    render(
      <GrowthTrendChart
        activityA={mockActivity}
        activityB={mockActivity}
        labelA="User A"
        labelB="User B"
      />
    );

  it('renders heading with dark and light theme text classes', () => {
    renderChart();

    const heading = screen.getByText(/contribution growth trend/i);

    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');
  });

  it('renders legend labels with theme-aware contrast styling', () => {
    renderChart();

    const userA = screen.getByText('User A');
    const userB = screen.getByText('User B');

    expect(userA.className).toContain('text-gray-900');
    expect(userA.className).toContain('dark:text-white/80');
    expect(userB.className).toContain('text-gray-900');
    expect(userB.className).toContain('dark:text-white/80');
  });

  it('renders container with dark and light background variants', () => {
    const { container } = renderChart();

    const card = container.firstChild as HTMLElement;

    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('dark:bg-[#0a0a0a]');
  });

  it('renders border classes that support both themes', () => {
    const { container } = renderChart();

    const card = container.firstChild as HTMLElement;

    expect(card.className).toContain('border');
    expect(card.className).toContain('border-black/10');
    expect(card.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('renders battle timeline entries without clipping foreground content', () => {
    renderChart();

    expect(screen.getByText(/commit battle timeline/i)).toBeInTheDocument();
    expect(screen.getAllByText(/jan|feb|mar/i).length).toBeGreaterThan(0);
  });
});
