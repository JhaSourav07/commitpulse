import { render, screen, fireEvent } from '@testing-library/react';
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
      <div {...props}>{props.children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('Heatmap Mock Integrations', () => {
  const mockData: ActivityData[] = [
    {
      date: '2025-01-01',
      count: 5,
      intensity: 2,
    },
    {
      date: '2025-01-02',
      count: 3,
      intensity: 1,
    },
    {
      date: '2025-01-03',
      count: 1,
      intensity: 1,
    },
  ];

  it('renders empty state when no activity exists', () => {
    render(<Heatmap data={[]} />);

    expect(screen.getByText(/no recent activity to display/i)).toBeDefined();
  });

  it('renders grid cells when activity data exists', () => {
    render(<Heatmap data={mockData} />);

    expect(screen.getAllByRole('gridcell')).toHaveLength(3);
  });

  it('shows tooltip information on hover', () => {
    render(<Heatmap data={mockData} />);

    const cell = screen.getAllByRole('gridcell')[0];

    fireEvent.mouseEnter(cell);

    expect(screen.getByText(/active streak/i)).toBeDefined();
  });

  it('hides tooltip when mouse leaves cell', () => {
    render(<Heatmap data={mockData} />);

    const cell = screen.getAllByRole('gridcell')[0];

    fireEvent.mouseEnter(cell);

    expect(screen.getByText(/active streak/i)).toBeDefined();

    fireEvent.mouseLeave(cell);

    expect(screen.queryByText(/active streak/i)).toBeNull();
  });

  it('provides accessible aria labels for contribution cells', () => {
    render(<Heatmap data={mockData} />);

    const cell = screen.getAllByRole('gridcell')[0];

    expect(cell.getAttribute('aria-label')).toMatch(/contribution/i);
  });
});
