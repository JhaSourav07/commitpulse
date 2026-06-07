import { fireEvent, render, screen } from '@testing-library/react';
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

describe('GrowthTrendChart mouse interactivity', () => {
  const renderChart = () =>
    render(
      <GrowthTrendChart
        activityA={mockActivity}
        activityB={mockActivity}
        labelA="User A"
        labelB="User B"
      />
    );

  it('handles mouse enter events without crashing', () => {
    const { container } = renderChart();

    const svg = container.querySelector('svg');

    fireEvent.mouseEnter(svg!);

    expect(svg).toBeInTheDocument();
  });

  it('handles mouse leave events without removing chart content', () => {
    const { container } = renderChart();

    const svg = container.querySelector('svg');

    fireEvent.mouseLeave(svg!);

    expect(screen.getByText(/contribution growth trend/i)).toBeInTheDocument();
  });

  it('handles click events on chart area', () => {
    const { container } = renderChart();

    const svg = container.querySelector('svg');

    fireEvent.click(svg!);

    expect(screen.getByText('User A')).toBeInTheDocument();
  });

  it('handles touch events without affecting rendering', () => {
    const { container } = renderChart();

    const svg = container.querySelector('svg');

    fireEvent.touchStart(svg!);
    fireEvent.touchEnd(svg!);

    expect(screen.getByText('User B')).toBeInTheDocument();
  });

  it('keeps timeline content visible after interaction events', () => {
    const { container } = renderChart();

    const svg = container.querySelector('svg');

    fireEvent.mouseEnter(svg!);
    fireEvent.mouseMove(svg!);
    fireEvent.mouseLeave(svg!);

    expect(screen.getByText(/commit battle timeline/i)).toBeInTheDocument();
  });
});
