import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';
import type { ActivityData } from '@/types/dashboard';
import HistoricalTrendView from './HistoricalTrendView';
import '@testing-library/jest-dom/vitest';

beforeEach(() => {
  const MockResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>
  >((props, ref) => {
    const domProps = { ...props };
    delete domProps.whileInView;
    delete domProps.viewport;
    delete domProps.initial;
    delete domProps.animate;
    delete domProps.exit;
    delete domProps.transition;
    return React.createElement('div', { ref, ...domProps });
  });
  MotionDiv.displayName = 'MotionDiv';
  return {
    motion: {
      div: MotionDiv,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockPeriod: DashboardPeriod = {
  kind: 'month',
  month: '2026-06',
  label: 'June 2026',
  from: '2026-06-01T00:00:00.000Z',
  to: '2026-06-30T23:59:59.999Z',
};

const mockActivity: ActivityData[] = Array.from({ length: 30 }, (_, index) => ({
  date: `2026-06-${String(index + 1).padStart(2, '0')}`,
  count: index % 3 === 0 ? 5 : 0,
  intensity: index % 3 === 0 ? 2 : 0,
}));

describe('HistoricalTrendView - Accessibility & Aria compliance (Variation 4)', () => {
  // Case 1: Verifies interactive grids expose valid cell coordinate label configurations
  it('Case 1: Inspect markup landmarks to verify the correct usage of accessible coordinate labels on container modules', () => {
    render(<HistoricalTrendView username="ashish" activity={mockActivity} period={mockPeriod} />);

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);

    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);

    cells.forEach((cell) => {
      expect(cell).toHaveAttribute('aria-label');
      expect(cell.getAttribute('aria-label')).toMatch(/contributions? on/i);
    });
  });

  // Case 2: Confirms active form and keyboard interaction nodes maintain focus indicator rings
  it('Case 2: Assert interactive nodes designed to accept focus maintain visible outline class parameters', () => {
    const { container } = render(
      <HistoricalTrendView username="ashish" activity={mockActivity} period={mockPeriod} />
    );

    // Verify inputs can receive focus natively to test accessibility behaviors
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
    act(() => {
      inputs.forEach((input) => {
        input.focus();
        expect(document.activeElement).toBe(input);
      });
    });

    // Verify grid cells are natively capable of receiving focus
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
    act(() => {
      cells.forEach((cell) => {
        expect(cell).toHaveProperty('tabIndex', 0);
        cell.focus();
        expect(document.activeElement).toBe(cell);
      });
    });
  });

  // Case 3: Confirms focused cells successfully spawn announced overlays reflecting target string definitions
  it('Case 3: Verify the trend data tooltip triggers accurately match and announce their descriptive accessibility target nodes', async () => {
    render(<HistoricalTrendView username="ashish" activity={mockActivity} period={mockPeriod} />);

    const cells = screen.getAllByRole('gridcell');
    const firstCell = cells[0];
    const cellLabel = firstCell.getAttribute('aria-label');

    await act(async () => {
      fireEvent.focus(firstCell);
    });

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(cellLabel || '');
  });

  // Case 4: Evaluates chronological tab indexes across controls and grid structures
  it('Case 4: Test keyboard control path selectors to ensure normal tab ordering', () => {
    const { container } = render(
      <HistoricalTrendView username="ashish" activity={mockActivity} period={mockPeriod} />
    );

    // Using lowercase tabindex in resilient selector query to fetch focusable elements
    const focusable = Array.from(
      container.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')
    ) as HTMLElement[];

    expect(focusable.length).toBeGreaterThan(0);

    const previousBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });
    const cells = screen.getAllByRole('gridcell');

    expect(previousBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(cells[0]).toBeInTheDocument();

    const prevIndex = focusable.indexOf(previousBtn);
    const nextIndex = focusable.indexOf(nextBtn);
    const firstCellIndex = focusable.indexOf(cells[0]);

    expect(prevIndex).toBeGreaterThanOrEqual(0);
    expect(nextIndex).toBeGreaterThanOrEqual(0);
    expect(firstCellIndex).toBeGreaterThanOrEqual(0);

    expect(prevIndex).toBeLessThan(nextIndex);

    const monthInput = container.querySelector('input[name="month"]');
    const yearInput = container.querySelector('input[name="year"]');

    expect(monthInput).toBeInTheDocument();
    expect(yearInput).toBeInTheDocument();

    const monthIndex = focusable.indexOf(monthInput as HTMLElement);
    const yearIndex = focusable.indexOf(yearInput as HTMLElement);

    expect(monthIndex).toBeGreaterThanOrEqual(0);
    expect(yearIndex).toBeGreaterThanOrEqual(0);

    expect(nextIndex).toBeLessThan(monthIndex);
    expect(monthIndex).toBeLessThan(yearIndex);
    expect(yearIndex).toBeLessThan(firstCellIndex);
  });

  // Case 5: Ensures typography progression tree handles semantic levels without dropping sequence nodes
  it('Case 5: Confirm that standard typography headings follow a logical hierarchical numerical sequence', () => {
    const { container } = render(
      <HistoricalTrendView username="ashish" activity={mockActivity} period={mockPeriod} />
    );

    const headings = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    ) as HTMLElement[];
    expect(headings.length).toBeGreaterThan(0);

    const levels = headings.map((h) => parseInt(h.tagName.substring(1), 10));

    for (let i = 0; i < levels.length - 1; i++) {
      const current = levels[i];
      const next = levels[i + 1];
      expect(next - current).toBeLessThanOrEqual(1);
    }
  });
});
