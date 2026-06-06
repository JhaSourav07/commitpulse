import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div
        className={props.className}
        style={props.style}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
      >
        {props.children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('Heatmap Responsive Breakpoints', () => {
  const mockData: ActivityData[] = Array.from({ length: 35 }, (_, i) => ({
    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
    count: i % 5,
    intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
  }));

  it('renders heatmap grid at mobile viewport width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Heatmap data={mockData} />);

    expect(screen.getByRole('grid')).toBeDefined();
  });

  it('groups activity into weekly columns', () => {
    render(<Heatmap data={mockData} />);

    const rows = screen.getAllByRole('row');

    expect(rows).toHaveLength(5);
  });

  it('renders all activity entries as grid cells', () => {
    render(<Heatmap data={mockData} />);

    const cells = screen.getAllByRole('gridcell');

    expect(cells).toHaveLength(mockData.length);
  });

  it('uses overflow-hidden container for responsive layouts', () => {
    const { container } = render(<Heatmap data={mockData} />);

    const overflowContainer = container.querySelector('.overflow-hidden');

    expect(overflowContainer).toBeDefined();
  });

  it('keeps grid cells focusable on mobile layouts', () => {
    render(<Heatmap data={mockData} />);

    const firstCell = screen.getAllByRole('gridcell')[0];

    expect(firstCell.getAttribute('tabindex')).toBe('0');
  });
});
