import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

// 1. Mock ResizeObserver (JSDOM lacks it)
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// 2. Mock framer-motion with inline types to prevent hoisting errors
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

describe('Heatmap', () => {
  // Create a strongly typed empty array to fix the `data={[]}` red lines
  const emptyData: ActivityData[] = [];

  // Helper to generate properly typed mock data
  const generateMockData = (days: number): ActivityData[] => {
    return Array.from({ length: days }, (_, i) => ({
      date: `2024-01-${(i % 28) + 1}`,
      count: 5,
      intensity: 2,
    }));
  };

  it("renders 'Contribution Heatmap' heading", () => {
    render(<Heatmap data={emptyData} />);
    expect(screen.getByRole('heading', { name: /contribution heatmap/i })).toBeDefined();
  });

  it("renders 'Last 365 days' subtitle", () => {
    render(<Heatmap data={emptyData} />);
    expect(screen.getByText(/last 365 days/i)).toBeDefined();
  });

  it("renders 'Less' and 'More' legend labels", () => {
    render(<Heatmap data={emptyData} />);
    expect(screen.getByText(/less/i)).toBeDefined();
    expect(screen.getByText(/more/i)).toBeDefined();
  });

  it('renders without crashing with an empty data array', () => {
    expect(() => render(<Heatmap data={emptyData} />)).not.toThrow();
  });

  it('renders without crashing with 365 days of data', () => {
    expect(() => render(<Heatmap data={generateMockData(365)} />)).not.toThrow();
  });
});
