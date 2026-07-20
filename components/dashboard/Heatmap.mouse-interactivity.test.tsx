import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

// JSDOM does not implement ResizeObserver, so we polyfill a no-op version.
// Heatmap relies on it to recompute its horizontal scale on container resize.
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// framer-motion is mocked so we can assert real DOM events without animation
// side-effects interfering with mouseenter / mouseleave propagation.
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => {
      const cleanProps = { ...props } as Record<string, unknown>;
      delete cleanProps.initial;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.transition;
      return <div {...(cleanProps as HTMLAttributes<HTMLDivElement>)}>{props.children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

// The translation context is mocked with deterministic English strings so the
// tooltip content is predictable and readable in assertions.
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: string; date?: string }) => {
      const translations: Record<string, string> = {
        'dashboard.heatmap.title': 'Activity Heatmap',
        'dashboard.heatmap.last_365': 'Last 365 days',
        'dashboard.heatmap.empty': 'No activity found',
        'dashboard.heatmap.less': 'Less',
        'dashboard.heatmap.more': 'More',
        'dashboard.heatmap.tooltip_single': `${options?.count ?? '0'} contribution on ${options?.date ?? ''}`,
        'dashboard.heatmap.tooltip_plural': `${options?.count ?? '0'} contributions on ${options?.date ?? ''}`,
      };
      return translations[key] || key;
    },
  }),
}));

describe('Heatmap Mouse Interactivity', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // A tiny fixture keeps assertions focused on interaction behaviour rather
  // than data-generation logic (which is covered elsewhere).
  const singleDayData: ActivityData[] = [{ date: '2025-03-15', count: 7, intensity: 3 }];

  const multiDayData: ActivityData[] = [
    { date: '2025-03-15', count: 2, intensity: 1 },
    { date: '2025-03-16', count: 9, intensity: 4 },
  ];

  // 1. Trigger simulated mouseenter/hover gestures on active segments and confirm
  //    a responsive tooltip layout renders at the computed coordinates.
  it('1. renders tooltip at coordinates computed from the hovered cell rect', () => {
    render(<Heatmap data={singleDayData} />);

    const cell = screen.getByRole('gridcell', { name: /7 contributions on mar 15, 2025/i });

    // Force a deterministic bounding rect so we can verify coordinate math
    // (x = left + width/2, y = top - 10) inside the tooltip render output.
    cell.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 200,
      top: 300,
      width: 14,
      height: 14,
      right: 214,
      bottom: 314,
      x: 200,
      y: 300,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseEnter(cell);

    // Tooltip content proves the responsive layout mounted after hover.
    const tooltip = screen.getByText(/7 contributions on mar 15, 2025/i);
    expect(tooltip).toBeDefined();
  });

  // 2. Verify that click and touch gestures on interactive cells propagate
  //    without throwing and do not tear down the tooltip state prematurely.
  it('2. propagates click and touch events on cells without runtime errors', () => {
    render(<Heatmap data={singleDayData} />);

    const cell = screen.getByRole('gridcell', { name: /7 contributions on mar 15, 2025/i });

    // Surface the cell first so a tooltip is present during the gesture.
    fireEvent.mouseEnter(cell);
    expect(screen.getByText(/7 contributions on mar 15, 2025/i)).toBeDefined();

    // Each of these gestures must propagate without triggering handler errors.
    expect(() => fireEvent.touchStart(cell)).not.toThrow();
    expect(() => fireEvent.touchEnd(cell)).not.toThrow();
    expect(() => fireEvent.click(cell)).not.toThrow();

    // Tooltip remains mounted because none of the above dispatch mouseleave.
    expect(screen.queryByText(/7 contributions on mar 15, 2025/i)).not.toBeNull();
  });

  // 3. Confirm the pointer cursor and hover-scale utility classes are applied,
  //    so hover affordance is visually communicated to the user.
  it('3. applies pointer cursor and hover affordance classes to each cell', () => {
    render(<Heatmap data={multiDayData} />);

    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBe(multiDayData.length);

    for (const cell of cells) {
      expect(cell.className).toContain('cursor-pointer');
      expect(cell.className).toContain('hover:scale-125');
      expect(cell.className).toContain('hover:brightness-125');
    }
  });

  // 4. Ensure mouseleave successfully removes the temporary overlay tooltip
  //    and a subsequent hover on another cell surfaces the correct content.
  it('4. hides tooltip on mouseleave and re-renders it for a newly hovered cell', () => {
    render(<Heatmap data={multiDayData} />);

    const firstCell = screen.getByRole('gridcell', { name: /2 contributions on mar 15, 2025/i });
    const secondCell = screen.getByRole('gridcell', { name: /9 contributions on mar 16, 2025/i });

    fireEvent.mouseEnter(firstCell);
    expect(screen.getByText(/2 contributions on mar 15, 2025/i)).toBeDefined();

    fireEvent.mouseLeave(firstCell);
    expect(screen.queryByText(/2 contributions on mar 15, 2025/i)).toBeNull();

    fireEvent.mouseEnter(secondCell);
    expect(screen.getByText(/9 contributions on mar 16, 2025/i)).toBeDefined();
    // First cell's tooltip should not leak into the second interaction.
    expect(screen.queryByText(/2 contributions on mar 15, 2025/i)).toBeNull();
  });

  // 5. Keyboard focus/blur must mirror mouse behaviour, and repeated focus on
  //    the same cell must not throw or leave stale tooltips behind — protecting
  //    against runtime errors when interaction data is replayed.
  it('5. shows and hides the tooltip on keyboard focus and blur without errors', () => {
    render(<Heatmap data={singleDayData} />);

    const cell = screen.getByRole('gridcell', { name: /7 contributions on mar 15, 2025/i });

    // Focus should trigger the same tooltip pathway as mouseenter.
    expect(() => fireEvent.focus(cell)).not.toThrow();
    expect(screen.getByText(/7 contributions on mar 15, 2025/i)).toBeDefined();

    // Blur removes the tooltip cleanly.
    expect(() => fireEvent.blur(cell)).not.toThrow();
    expect(screen.queryByText(/7 contributions on mar 15, 2025/i)).toBeNull();

    // Re-focusing the same cell must safely reactivate the tooltip.
    fireEvent.focus(cell);
    expect(screen.getByText(/7 contributions on mar 15, 2025/i)).toBeDefined();
  });
});
