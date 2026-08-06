/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityHeatmapPro from './ActivityHeatmapPro';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterProps(props)}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function filterProps(props: Record<string, any>) {
  const filtered: Record<string, any> = {};
  for (const key of Object.keys(props)) {
    if (
      ![
        'initial',
        'animate',
        'exit',
        'transition',
        'whileHover',
        'whileTap',
        'layout',
        'mode',
      ].includes(key)
    ) {
      filtered[key] = props[key];
    }
  }
  return filtered;
}

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'dashboard.heatmap.title': 'Activity Pro',
        'dashboard.heatmap.less': 'Less',
        'dashboard.heatmap.more': 'More',
        'dashboard.heatmap.total': 'Total',
        'dashboard.heatmap.peak': 'Peak',
        'dashboard.heatmap.daily_avg': 'Daily Avg',
        'dashboard.heatmap.active_days': 'Active Days',
      };
      if (key === 'dashboard.heatmap.description') {
        const active = options?.active ?? 0;
        const total = options?.total ?? 0;
        return `${active} active days · ${total} contributions`;
      }
      return translations[key] || key;
    },
  }),
}));

const baseProps = {
  activity: [
    { date: '2024-01-01', count: 5, intensity: 2 as const },
    { date: '2024-01-02', count: 3, intensity: 1 as const },
    { date: '2024-01-03', count: 12, intensity: 4 as const },
    { date: '2024-01-04', count: 0, intensity: 0 as const },
  ],
  commitClock: [
    { day: 'Sun', commits: 5 },
    { day: 'Mon', commits: 10 },
    { day: 'Tue', commits: 15 },
    { day: 'Wed', commits: 20 },
    { day: 'Thu', commits: 25 },
    { day: 'Fri', commits: 30 },
    { day: 'Sat', commits: 35 },
  ],
};

describe('ActivityHeatmapPro Component', () => {
  it('renders heatmap container and title', () => {
    render(<ActivityHeatmapPro {...baseProps} />);
    expect(screen.getByText('Activity Pro')).toBeDefined();
  });

  it('renders the correct stats cards summaries', () => {
    render(<ActivityHeatmapPro {...baseProps} />);
    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getByText('Peak')).toBeDefined();
    expect(screen.getByText('Daily Avg')).toBeDefined();
    expect(screen.getByText('Active Days')).toBeDefined();
  });

  it('toggles view modes when tab buttons are clicked', () => {
    render(<ActivityHeatmapPro {...baseProps} />);

    // Switch to Hourly
    const hourlyTab = screen.getByRole('button', { name: /Hourly/i });
    fireEvent.click(hourlyTab);
    expect(screen.getByText('Morning')).toBeDefined();
    expect(screen.getByText('Afternoon')).toBeDefined();

    // Switch to Weekly
    const weeklyTab = screen.getByRole('button', { name: /Weekly/i });
    fireEvent.click(weeklyTab);
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Fri')).toBeDefined();

    // Switch to Monthly
    const monthlyTab = screen.getByRole('button', { name: /Monthly/i });
    fireEvent.click(monthlyTab);
    expect(screen.getByText('Jan 24')).toBeDefined();
  });

  it('renders focusable cells with gridcell role and tabIndex={0}', () => {
    render(<ActivityHeatmapPro {...baseProps} />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => {
      expect(cell).toHaveAttribute('tabIndex', '0');
    });
  });

  it('updates aria-live announcement on cell focus', () => {
    render(<ActivityHeatmapPro {...baseProps} />);
    const liveRegion = screen.getByTestId('activity-pro-aria-live');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');

    const cells = screen.getAllByRole('gridcell');
    fireEvent.focus(cells[0]);
    expect(liveRegion).toHaveTextContent('5 contributions on 2024-01-01');

    fireEvent.focus(cells[1]);
    expect(liveRegion).toHaveTextContent('3 contributions on 2024-01-02');
  });

  it('navigates across heatmap cells using arrow keys', () => {
    // 14 days of activity
    const FourteenDays = {
      activity: Array.from({ length: 14 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        count: i + 1,
        intensity: 1 as const,
      })),
    };
    render(<ActivityHeatmapPro {...FourteenDays} />);

    const cells = screen.getAllByRole('gridcell');
    const cell0 = cells[0];
    const cell1 = cells[1];
    const cell7 = cells[7];

    cell0.focus();
    expect(document.activeElement).toBe(cell0);

    // ArrowDown moves down 1 day in same column (index 0 -> index 1)
    fireEvent.keyDown(cell0, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cell1);

    // ArrowRight moves 7 days right (index 1 -> index 8)
    const cell8 = cells[8];
    fireEvent.keyDown(cell1, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cell8);

    // ArrowUp moves up 1 day (index 8 -> index 7)
    fireEvent.keyDown(cell8, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(cell7);

    // ArrowLeft moves 7 days left (index 7 -> index 0)
    fireEvent.keyDown(cell7, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cell0);
  });
});
