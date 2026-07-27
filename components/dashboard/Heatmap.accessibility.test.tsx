// components/dashboard/Heatmap.accessibility.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock framer-motion with proper prop propagation to preserve roles/ARIA/handlers
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    }: { children?: ReactNode } & Record<string, any>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('Heatmap Accessibility Standards', () => {
  // Helper to generate properly typed mock data
  const generateMockData = (days: number): ActivityData[] => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.UTC(2024, 0, i + 1));
      const yyyy = date.getUTCFullYear();
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      return {
        date: `${yyyy}-${mm}-${dd}`,
        count: (i % 3) + 1, // Ensure some non-zero counts so hasData is true
        intensity: ((i % 3) + 1) as ActivityData['intensity'],
      };
    });
  };

  it('renders a semantic heading H3 for the heatmap title', () => {
    const customTitle = 'Project Contribution Flow';
    render(<Heatmap data={generateMockData(14)} title={customTitle} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(customTitle);
  });

  it('structures the layout using correct grid and row semantics', () => {
    render(<Heatmap data={generateMockData(14)} />);

    // The main grid container should have role="grid"
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    // Since we generated 14 days, there should be 2 weeks (2 rows of days)
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);

    rows.forEach((row) => {
      expect(grid).toContainElement(row);
    });
  });

  it('assigns gridcell role and correct focusable index to all day cells', () => {
    render(<Heatmap data={generateMockData(14)} />);

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(14);

    cells.forEach((cell) => {
      expect(cell).toHaveAttribute('tabIndex', '0');
    });
  });

  it('provides descriptive aria-labels for day cells containing contribution stats', () => {
    const data = [
      { date: '2024-01-01', count: 0, intensity: 0 as const },
      { date: '2024-01-02', count: 1, intensity: 1 as const },
      { date: '2024-01-03', count: 5, intensity: 3 as const },
    ];
    render(<Heatmap data={data} />);

    const cells = screen.getAllByRole('gridcell');

    // Day 1: 0 contributions
    expect(cells[0]).toHaveAttribute('aria-label', '0 contributions on Jan 1, 2024');

    // Day 2: 1 contribution
    expect(cells[1]).toHaveAttribute('aria-label', '1 contribution on Jan 2, 2024');

    // Day 3: 5 contributions
    expect(cells[2]).toHaveAttribute('aria-label', '5 contributions on Jan 3, 2024');
  });

  it('handles keyboard navigation by displaying the tooltip on focus and hiding it on blur', () => {
    const data = [{ date: '2024-01-01', count: 3, intensity: 2 as const }];
    render(<Heatmap data={data} />);

    const cell = screen.getByRole('gridcell');

    // Tooltip should not be in document initially
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Focus the cell to simulate Tab navigation
    fireEvent.focus(cell);

    // Tooltip should appear
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('3 contributions on Jan 1, 2024');
    expect(tooltip).toHaveTextContent('Steady contribution day');

    // Blur the cell to simulate moving focus away
    fireEvent.blur(cell);

    // Tooltip should disappear
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows empty message fallback when no data is provided or all counts are 0', () => {
    const emptyMessage = 'No activities to show';
    // Test case 1: empty data array
    const { rerender } = render(<Heatmap data={[]} emptyMessage={emptyMessage} />);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByText(emptyMessage)).toBeInTheDocument();

    // Test case 2: data has only 0 counts
    const zeroData = [
      { date: '2024-01-01', count: 0, intensity: 0 as const },
      { date: '2024-01-02', count: 0, intensity: 0 as const },
    ];
    rerender(<Heatmap data={zeroData} emptyMessage={emptyMessage} />);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });
});
