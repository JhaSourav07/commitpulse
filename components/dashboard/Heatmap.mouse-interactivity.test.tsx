// components/dashboard/Heatmap.mouse-interactivity.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode } from 'react';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';
import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver (JSDOM lacks it)
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock framer-motion with proper prop propagation to preserve event handlers and styling
/* eslint-disable @typescript-eslint/no-unused-vars */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      whileInView,
      viewport,
      transition,
      animate,
      exit,
      ...props
    }: { children?: ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));
/* eslint-enable @typescript-eslint/no-unused-vars */

describe('Heatmap Mouse Interactivity', () => {
  const generateMockData = (): ActivityData[] => [
    { date: '2024-01-01', count: 3, intensity: 2 },
    { date: '2024-01-02', count: 0, intensity: 0 },
    { date: '2024-01-03', count: 6, intensity: 3 },
  ];

  it('displays tooltip on hover/mouseenter and removes it on unhover/mouseleave', async () => {
    const user = userEvent.setup();
    render(<Heatmap data={generateMockData()} />);

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(3);

    // Initial state: tooltip should not exist
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Hover over the first cell (3 contributions)
    await user.hover(cells[0]);

    // Tooltip should be visible
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('3 contributions on Jan 1, 2024');

    // Unhover/Leave the cell
    await user.unhover(cells[0]);

    // Tooltip should disappear
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('updates tooltip contents dynamically when moving hover from one cell to another', async () => {
    const user = userEvent.setup();
    render(<Heatmap data={generateMockData()} />);

    const cells = screen.getAllByRole('gridcell');

    // Hover over first cell
    await user.hover(cells[0]);
    let tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('3 contributions on Jan 1, 2024');
    expect(tooltip).toHaveTextContent('Steady contribution day');

    // Move hover directly to third cell (6 contributions, high activity)
    await user.hover(cells[2]);
    tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('6 contributions on Jan 3, 2024');
    expect(tooltip).toHaveTextContent('High activity day');
  });

  it('verifies that tooltip content correctly details streak labels', async () => {
    const user = userEvent.setup();
    // Generate streak: Day 1 (count: 3), Day 2 (count: 5)
    const streakData: ActivityData[] = [
      { date: '2024-01-01', count: 3, intensity: 2 },
      { date: '2024-01-02', count: 5, intensity: 3 },
    ];
    render(<Heatmap data={streakData} />);

    const cells = screen.getAllByRole('gridcell');

    await user.hover(cells[1]);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('2-day active streak');
  });

  it('contains the correct cursor and interactive hover class styles on the gridcells', () => {
    render(<Heatmap data={generateMockData()} />);

    const cells = screen.getAllByRole('gridcell');

    cells.forEach((cell) => {
      expect(cell).toHaveClass('cursor-pointer');
      expect(cell).toHaveClass('hover:scale-125');
      expect(cell).toHaveClass('hover:brightness-125');
    });
  });

  it('does not trigger tooltips when hovering over the empty fallback state', async () => {
    const user = userEvent.setup();
    const emptyMessage = 'No recent activity to display';
    render(<Heatmap data={[]} emptyMessage={emptyMessage} />);

    // Grid should not be present
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();

    const fallbackElement = screen.getByText(emptyMessage);
    expect(fallbackElement).toBeInTheDocument();

    // Hover over fallback element
    await user.hover(fallbackElement);

    // Tooltip should not be created/visible
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
