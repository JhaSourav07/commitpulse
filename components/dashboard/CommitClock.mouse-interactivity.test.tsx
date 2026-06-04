import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('./VisualizationTooltip', () => ({
  default: ({ title, x, y, children }: any) => (
    <div data-testid="tooltip" data-x={x} data-y={y}>
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock('./tooltipUtils', () => ({
  getContributionLabel: (commits: number) => `${commits} commits`,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    g: ({ children, ...props }: any) => (
      <g {...props}>{children}</g>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import CommitClock from './CommitClock';

const mockData = [
  { day: 'Mon', commits: 10 },
  { day: 'Tue', commits: 4 },
  { day: 'Wed', commits: 0 },
  { day: 'Thu', commits: 2 },
  { day: 'Fri', commits: 6 },
  { day: 'Sat', commits: 1 },
  { day: 'Sun', commits: 3 },
];

describe('CommitClock mouse interactivity', () => {
  it('shows tooltip on mouse enter', () => {
    render(<CommitClock data={mockData} />);

    const segment = screen.getByLabelText('Mon: 10 commits');

    vi.spyOn(segment, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 40,
      height: 20,
      right: 140,
      bottom: 70,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseEnter(segment);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Mon activity')).toBeInTheDocument();
  });

  it('updates tooltip coordinates on mouse move', () => {
    render(<CommitClock data={mockData} />);

    const segment = screen.getByLabelText('Tue: 4 commits');

    vi.spyOn(segment, 'getBoundingClientRect').mockReturnValue({
      left: 200,
      top: 80,
      width: 60,
      height: 20,
      right: 260,
      bottom: 100,
      x: 200,
      y: 80,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseMove(segment);

    const tooltip = screen.getByTestId('tooltip');

    expect(tooltip).toHaveAttribute('data-x', '230');
    expect(tooltip).toHaveAttribute('data-y', '70');
  });

  it('applies cursor pointer styling', () => {
    render(<CommitClock data={mockData} />);

    const segment = screen.getByLabelText('Fri: 6 commits');

    expect(segment).toHaveClass('cursor-pointer');
    expect(segment).toHaveAttribute('tabindex', '0');
  });

  it('propagates click and touch events', () => {
    render(<CommitClock data={mockData} />);

    const segment = screen.getByLabelText('Sat: 1 commits');

    const clickHandler = vi.fn();
    const touchHandler = vi.fn();

    segment.addEventListener('click', clickHandler);
    segment.addEventListener('touchstart', touchHandler);

    fireEvent.click(segment);
    fireEvent.touchStart(segment);

    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(touchHandler).toHaveBeenCalledTimes(1);
  });

  it('hides tooltip on mouse leave', () => {
    render(<CommitClock data={mockData} />);

    const segment = screen.getByLabelText('Sun: 3 commits');

    vi.spyOn(segment, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 40,
      height: 20,
      right: 140,
      bottom: 70,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseEnter(segment);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(segment);

    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });
});

