import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';
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
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      >
        {props.children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const generateMassiveData = (days: number): ActivityData[] =>
  Array.from({ length: days }, (_, index) => ({
    date: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(
      2,
      '0'
    )}`,
    count: index * 1000,
    intensity: (index % 5) as ActivityData['intensity'],
  }));

describe('Heatmap massive scaling', () => {
  it('renders without crashing with thousands of activity records', () => {
    const massiveData = generateMassiveData(5000);

    expect(() => render(<Heatmap data={massiveData} />)).not.toThrow();
  });

  it('renders a scalable grid for high-volume activity data', () => {
    const massiveData = generateMassiveData(1000);

    render(<Heatmap data={massiveData} />);

    expect(screen.getByRole('grid')).toBeDefined();
    expect(screen.getAllByRole('gridcell')).toHaveLength(1000);
  });

  it('keeps legend and labels visible under massive data load', () => {
    const massiveData = generateMassiveData(2000);

    render(<Heatmap data={massiveData} />);

    expect(screen.getByText(/less/i)).toBeDefined();
    expect(screen.getByText(/more/i)).toBeDefined();
    expect(screen.getByRole('heading', { name: /contribution heatmap/i })).toBeDefined();
  });

  it('renders within acceptable performance bounds for large datasets', () => {
    const massiveData = generateMassiveData(3650);

    const start = performance.now();

    render(<Heatmap data={massiveData} />);

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(2000);
    expect(screen.getByRole('grid')).toBeDefined();
  });

  it('handles extreme contribution counts without breaking grid cells', () => {
    const massiveData: ActivityData[] = generateMassiveData(365).map((day, index) => ({
      ...day,
      count: Number.MAX_SAFE_INTEGER - index,
      intensity: 4 as ActivityData['intensity'],
    }));

    render(<Heatmap data={massiveData} />);

    const cells = screen.getAllByRole('gridcell');

    expect(cells).toHaveLength(365);
    expect(cells[0].getAttribute('aria-label')).toContain('contributions');
  });
});
