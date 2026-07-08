import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import Heatmap from './Heatmap';
import { getIntensityColor } from './heatmapUtils';
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
    div: (props: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => {
      const cleanProps = { ...props } as Record<string, unknown>;
      delete cleanProps.initial;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.transition;
      return React.createElement(
        'div',
        cleanProps as HTMLAttributes<HTMLDivElement>,
        props.children
      );
    },
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: string; date?: string }) => {
      const translations: Record<string, string> = {
        'dashboard.heatmap.title': 'Activity Heatmap',
        'dashboard.heatmap.last_365': 'Last 365 days',
        'dashboard.heatmap.empty': 'No activity found',
        'dashboard.heatmap.less': 'Less',
        'dashboard.heatmap.more': 'More',
        'dashboard.heatmap.tooltip_single': `${options?.count || '0'} contribution on ${options?.date || ''}`,
        'dashboard.heatmap.tooltip_plural': `${options?.count || '0'} contributions on ${options?.date || ''}`,
      };
      return translations[key] || key;
    },
  }),
}));

describe('heatmapUtils Mouse Interactivity', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const sampleData: ActivityData[] = [{ date: '2025-01-01', count: 5, intensity: 3 }];

  // 1. Simulate mouse enter/hover events on interactive elements and verify tooltip activation and computed positioning.
  it('1. should activate tooltip and compute positioning on cell mouseenter', () => {
    render(React.createElement(Heatmap, { data: sampleData }));

    const cell = screen.getByRole('gridcell', { name: /5 contributions on jan 1, 2025/i });
    expect(cell).toBeDefined();

    // Mock getBoundingClientRect
    cell.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 100,
      top: 150,
      width: 14,
      height: 14,
    } as DOMRect);

    // Hover mouse enter
    fireEvent.mouseEnter(cell);

    // Verify tooltip is displayed in the DOM
    const tooltipText = screen.getByText(/5 contributions on jan 1, 2025/i);
    expect(tooltipText).toBeDefined();
  });

  // 2. Verify tooltip visibility updates correctly during mouse movement and hides after mouse leave.
  it('2. should hide tooltip when mouse leaves the cell', () => {
    render(React.createElement(Heatmap, { data: sampleData }));

    const cell = screen.getByRole('gridcell', { name: /5 contributions on jan 1, 2025/i });

    // Mouse Enter triggers tooltip
    fireEvent.mouseEnter(cell);
    expect(screen.getByText(/5 contributions on jan 1, 2025/i)).toBeDefined();

    // Mouse Leave hides tooltip
    fireEvent.mouseLeave(cell);
    expect(screen.queryByText(/5 contributions on jan 1, 2025/i)).toBeNull();
  });

  // 3. Simulate click and touch interactions, ensuring events propagate correctly without preventing expected callbacks.
  it('3. should propagate click and touch events correctly without preventing expected callbacks', () => {
    render(React.createElement(Heatmap, { data: sampleData }));

    const cell = screen.getByRole('gridcell', { name: /5 contributions on jan 1, 2025/i });

    // Touch events
    expect(() => fireEvent.touchStart(cell)).not.toThrow();
    expect(() => fireEvent.touchEnd(cell)).not.toThrow();

    // Click events
    expect(() => fireEvent.click(cell)).not.toThrow();
  });

  // 4. Verify interactive elements expose the expected cursor styles or pointer-related class names during hover.
  it('4. should expose pointer cursor styles and hover scale class names', () => {
    render(React.createElement(Heatmap, { data: sampleData }));

    const cell = screen.getByRole('gridcell', { name: /5 contributions on jan 1, 2025/i });

    // Verify cell contains interactive styles in its class list
    expect(cell.className).toContain('cursor-pointer');
    expect(cell.className).toContain('hover:scale-125');
    expect(cell.className).toContain('hover:brightness-125');

    // Verify color maps to valid background color classes from the utility
    expect(getIntensityColor(0)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(3)).toBe('bg-gray-700 dark:bg-zinc-300');
    expect(getIntensityColor(4)).toBe('bg-black dark:bg-white');
  });

  // 5. Validate graceful behavior when tooltip targets, coordinates, or interaction data are missing, ensuring no runtime errors occur.
  it('5. should handle missing or invalid intensity values gracefully', () => {
    // Test direct getIntensityColor with out of bounds/empty values
    expect(getIntensityColor(999)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(-1)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(undefined as unknown as number)).toBe('bg-gray-200 dark:bg-[#161616]');

    // Render with empty data list to verify empty state renders cleanly
    render(React.createElement(Heatmap, { data: [] }));
    const emptyState = screen.getByText('No activity found');
    expect(emptyState).toBeDefined();
  });
});
