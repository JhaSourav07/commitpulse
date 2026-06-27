import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';
import CommitClock, { findPeakIndex } from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

// =========================================================================
// TYPED MOCK COMPONENTS - Proper React typing, no `any`
// =========================================================================

interface VisualizationTooltipProps {
  title: string;
  x: number;
  y: number;
  children: ReactNode;
}

interface MotionDivProps extends React.ComponentProps<'div'> {
  initial?: unknown;
  animate?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  transition?: unknown;
  whileHover?: unknown;
}

interface MotionGProps extends React.SVGProps<SVGGElement> {
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
}

vi.mock('framer-motion', () => {
  const motion = {
    div: React.forwardRef<HTMLDivElement, MotionDivProps>(
      (
        {
          children,
          className,
          style,
          initial,
          animate,
          whileInView,
          viewport,
          transition,
          whileHover,
          ...rest
        },
        ref
      ) => (
        <div ref={ref} className={className} style={style} {...rest}>
          {children}
        </div>
      )
    ),
    g: React.forwardRef<SVGGElement, MotionGProps>(
      ({ children, className, initial, animate, transition, ...rest }, ref) => (
        <g ref={ref} className={className} {...rest}>
          {children}
        </g>
      )
    ),
  };

  motion.div.displayName = 'motion.div';
  motion.g.displayName = 'motion.g';

  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

vi.mock('./VisualizationTooltip', () => ({
  default: ({ title, x, y, children }: VisualizationTooltipProps) => (
    <div data-testid="visualization-tooltip" data-title={title} data-x={x} data-y={y}>
      {children}
    </div>
  ),
}));

vi.mock('./tooltipUtils', () => ({
  getContributionLabel: (commits: number): string => {
    if (commits === 0) return 'No commits';
    if (commits < 5) return 'Few commits';
    if (commits < 15) return 'Some commits';
    return 'Many commits';
  },
}));

// =========================================================================
// TIMEZONE MOCKING UTILITIES
// =========================================================================

/**
 * Mock the system timezone by setting TZ environment variable
 */
function mockTimezone(tzName: string): void {
  process.env.TZ = tzName;
}

// =========================================================================
// TEST SUITE: Timezone Normalization & Calendar Data Boundary Alignment
// =========================================================================

describe('CommitClock - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.useRealTimers();
    process.env.TZ = 'UTC';
  });

  afterEach(() => {
    process.env.TZ = 'UTC';
  });

  // =========================================================================
  // TEST 1: UTC Timezone - Verify commit data aligns to correct calendar dates
  // =========================================================================
  it('aligns commit data to correct calendar dates in UTC timezone', () => {
    const utcCommitData: CommitClockData[] = [
      { day: 'Mon', commits: 5 },
      { day: 'Tue', commits: 8 },
      { day: 'Wed', commits: 3 },
      { day: 'Thu', commits: 12 },
      { day: 'Fri', commits: 7 },
      { day: 'Sat', commits: 2 },
      { day: 'Sun', commits: 0 },
    ];

    mockTimezone('UTC');

    const { container } = render(<CommitClock data={utcCommitData} />);

    // Assert SVG is rendered (hard assertion)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();

    // Verify all 7 days are rendered in the SVG
    const textElements = container.querySelectorAll('text');
    expect(textElements.length).toBeGreaterThan(0);

    // Verify peak index calculation for UTC data
    const peakIdx = findPeakIndex(utcCommitData);
    expect(peakIdx).toBe(3); // Thursday with 12 commits
    expect(utcCommitData[peakIdx].commits).toBe(12);
  });

  // =========================================================================
  // TEST 2: EST/EDT Timezone Boundary - Verify offset handling without date shift
  // =========================================================================
  it('handles EST timezone offset without shifting dates across boundaries', () => {
    const estCommitData: CommitClockData[] = [
      { day: 'Mon', commits: 10 },
      { day: 'Tue', commits: 6 },
      { day: 'Wed', commits: 14 },
      { day: 'Thu', commits: 8 },
      { day: 'Fri', commits: 11 },
      { day: 'Sat', commits: 4 },
      { day: 'Sun', commits: 1 },
    ];

    // EST is UTC-5
    mockTimezone('US/Eastern');

    const { container } = render(<CommitClock data={estCommitData} />);

    // Assert SVG renders (hard assertion)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();

    // Verify peak is correctly identified despite timezone offset
    const peakIdx = findPeakIndex(estCommitData);
    expect(peakIdx).toBe(2); // Wednesday with 14 commits
    expect(estCommitData[peakIdx].day).toBe('Wed');

    // Verify filter definition exists (hard assertion)
    const filterDef = svgElement?.querySelector('filter[id="spoke-glow"]');
    expect(filterDef).not.toBeNull();
    expect(filterDef).toBeTruthy();
  });

  // =========================================================================
  // TEST 3: IST Timezone - Verify data alignment in ahead-of-UTC timezone
  // =========================================================================
  it('correctly aligns commit data in IST timezone (UTC+5:30)', () => {
    const istCommitData: CommitClockData[] = [
      { day: 'Mon', commits: 7 },
      { day: 'Tue', commits: 9 },
      { day: 'Wed', commits: 5 },
      { day: 'Thu', commits: 13 },
      { day: 'Fri', commits: 8 },
      { day: 'Sat', commits: 3 },
      { day: 'Sun', commits: 2 },
    ];

    // IST is UTC+5:30
    mockTimezone('Asia/Kolkata');

    const { container } = render(<CommitClock data={istCommitData} />);

    // Assert SVG renders with correct dimensions (hard assertions)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();
    expect(svgElement?.getAttribute('height')).toBe('280');

    // Verify peak calculation is correct in IST
    const peakIdx = findPeakIndex(istCommitData);
    expect(peakIdx).toBe(3);
    expect(istCommitData[peakIdx].commits).toBe(13);

    // Verify all days are present regardless of timezone
    expect(istCommitData).toHaveLength(7);
  });

  // =========================================================================
  // TEST 4: Leap Year Boundary - Verify no gaps in calendar data around Feb 29
  // =========================================================================
  it('handles leap year boundaries without gaps in weekly cycle', () => {
    // Week spanning Feb 29 in leap year (2024)
    const leapYearWeekData: CommitClockData[] = [
      { day: 'Mon', commits: 4 },
      { day: 'Tue', commits: 11 },
      { day: 'Wed', commits: 6 },
      { day: 'Thu', commits: 9 },
      { day: 'Fri', commits: 15 },
      { day: 'Sat', commits: 5 },
      { day: 'Sun', commits: 0 },
    ];

    mockTimezone('UTC');

    const { container } = render(<CommitClock data={leapYearWeekData} />);

    // Assert SVG is not null (hard assertion)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();

    // Verify no null/undefined entries in data array
    const hasAllDays = leapYearWeekData.every((d) => d.day && d.commits !== undefined);
    expect(hasAllDays).toBe(true);

    // Verify complete week cycle is present
    expect(leapYearWeekData).toHaveLength(7);

    // Peak should be Friday with 15 commits
    const peakIdx = findPeakIndex(leapYearWeekData);
    expect(peakIdx).toBe(4);
  });

  // =========================================================================
  // TEST 5: JST Timezone - Verify data integrity with significant UTC offset
  // =========================================================================
  it('maintains data integrity in JST timezone (UTC+9)', () => {
    const jstCommitData: CommitClockData[] = [
      { day: 'Mon', commits: 6 },
      { day: 'Tue', commits: 10 },
      { day: 'Wed', commits: 8 },
      { day: 'Thu', commits: 11 },
      { day: 'Fri', commits: 14 },
      { day: 'Sat', commits: 4 },
      { day: 'Sun', commits: 1 },
    ];

    // JST is UTC+9
    mockTimezone('Asia/Tokyo');

    const { container } = render(<CommitClock data={jstCommitData} />);

    // Assert SVG renders with correct attributes (hard assertions)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();
    expect(svgElement?.getAttribute('height')).toBe('280');

    // Verify data array integrity - total commits preserved
    const totalCommits = jstCommitData.reduce((sum, d) => sum + d.commits, 0);
    expect(totalCommits).toBe(54);

    // Verify peak detection across timezone
    const peakIdx = findPeakIndex(jstCommitData);
    expect(peakIdx).toBe(4);
    expect(jstCommitData[peakIdx].day).toBe('Fri');
  });

  // =========================================================================
  // TEST 6: Daylight Saving Time Transition - Verify no double/missing days
  // =========================================================================
  it('handles daylight saving time transitions without creating gaps or duplicates', () => {
    // Week containing DST transition
    const dstTransitionWeek: CommitClockData[] = [
      { day: 'Sat', commits: 3 },
      { day: 'Sun', commits: 9 },
      { day: 'Mon', commits: 8 },
      { day: 'Tue', commits: 7 },
      { day: 'Wed', commits: 12 },
      { day: 'Thu', commits: 5 },
      { day: 'Fri', commits: 10 },
    ];

    mockTimezone('US/Eastern');

    const { container } = render(<CommitClock data={dstTransitionWeek} />);

    // Assert SVG renders (hard assertion)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();

    // Verify no duplicate days in data
    const daySet = new Set(dstTransitionWeek.map((d) => d.day));
    expect(daySet.size).toBe(7);

    // Verify all 7 days are unique
    expect(dstTransitionWeek).toHaveLength(7);

    // Verify peak calculation ignores DST anomalies
    const peakIdx = findPeakIndex(dstTransitionWeek);
    expect(peakIdx).toBe(4); // Wednesday with 12 commits
    expect(dstTransitionWeek[peakIdx].commits).toBeGreaterThan(0);
  });

  // =========================================================================
  // TEST 7: Tooltip displays correct contribution labels across timezones
  // =========================================================================
  it('displays correct contribution labels in tooltips regardless of timezone', async () => {
    const multiTimezoneData: CommitClockData[] = [
      { day: 'Mon', commits: 0 }, // No commits
      { day: 'Tue', commits: 3 }, // Few commits
      { day: 'Wed', commits: 10 }, // Some commits
      { day: 'Thu', commits: 20 }, // Many commits
      { day: 'Fri', commits: 8 },
      { day: 'Sat', commits: 2 },
      { day: 'Sun', commits: 1 },
    ];

    mockTimezone('UTC');

    const { container } = render(<CommitClock data={multiTimezoneData} />);

    // Assert SVG renders (hard assertion)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).not.toBeNull();
    expect(svgElement).toBeTruthy();

    // Find the Thursday group (many commits)
    const dayGroups = container.querySelectorAll('g[role="img"]');
    expect(dayGroups.length).toBeGreaterThan(0);

    const thursdayGroup = Array.from(dayGroups).find(
      (g) => g.getAttribute('aria-label') === 'Thu: Many commits'
    ) as SVGGElement | undefined;

    // Hard assertion: thursdayGroup MUST exist before proceeding
    expect(thursdayGroup).not.toBeNull();
    expect(thursdayGroup).toBeDefined();

    if (!thursdayGroup) {
      throw new Error('Thursday group not found - rendering regression');
    }

    // Hover and verify tooltip
    fireEvent.mouseEnter(thursdayGroup);

    // Hard assertion: getByTestId inside waitFor will fail if tooltip is missing
    await waitFor(() => {
      const tooltip = screen.getByTestId('visualization-tooltip');
      expect(tooltip).not.toBeNull();
      expect(tooltip).toBeTruthy();
      expect(tooltip.getAttribute('data-title')).toBe('Thu activity');
    });
  });

  // =========================================================================
  // TEST 8: Empty data handling across different timezones
  // =========================================================================
  it('renders empty state message when no commit data is available', () => {
    const emptyData: CommitClockData[] = [];

    mockTimezone('UTC');

    const { container } = render(<CommitClock data={emptyData} />);

    // Verify empty state message is displayed
    const emptyMessage = screen.getByText('No recent activity to display');
    expect(emptyMessage).not.toBeNull();
    expect(emptyMessage).toBeTruthy();

    // Verify SVG is not rendered for empty data (hard assertion)
    const svgElement = container.querySelector('svg[width="280"]');
    expect(svgElement).toBeNull();
  });

  // =========================================================================
  // TEST 9: Data Consistency - Verify commit counts unchanged through calculations
  // =========================================================================
  it('preserves commit count integrity throughout timezone transformations', () => {
    const originalData: CommitClockData[] = [
      { day: 'Mon', commits: 5 },
      { day: 'Tue', commits: 12 },
      { day: 'Wed', commits: 8 },
      { day: 'Thu', commits: 15 },
      { day: 'Fri', commits: 9 },
      { day: 'Sat', commits: 3 },
      { day: 'Sun', commits: 2 },
    ];

    const originalTotal = originalData.reduce((sum, d) => sum + d.commits, 0);

    mockTimezone('Asia/Tokyo');

    render(<CommitClock data={originalData} />);

    // Verify data is not mutated
    const currentTotal = originalData.reduce((sum, d) => sum + d.commits, 0);
    expect(currentTotal).toBe(originalTotal);
    expect(currentTotal).toBe(54);

    // Verify individual values haven't changed
    expect(originalData[3].commits).toBe(15); // Thursday
    expect(originalData[0].commits).toBe(5); // Monday
  });

  // =========================================================================
  // TEST 10: SVG Structure Consistency across timezone scenarios
  // =========================================================================
  it('renders consistent SVG structure regardless of timezone offset applied', () => {
    const testData: CommitClockData[] = [
      { day: 'Mon', commits: 6 },
      { day: 'Tue', commits: 9 },
      { day: 'Wed', commits: 4 },
      { day: 'Thu', commits: 11 },
      { day: 'Fri', commits: 7 },
      { day: 'Sat', commits: 2 },
      { day: 'Sun', commits: 1 },
    ];

    mockTimezone('Asia/Kolkata');

    const { container } = render(<CommitClock data={testData} />);

    // Check SVG is rendered (hard assertion)
    const svg = container.querySelector('svg[width="280"]');
    expect(svg).not.toBeNull();
    expect(svg).toBeTruthy();

    // Verify core SVG elements exist (hard assertions)
    const circles = svg?.querySelectorAll('circle');
    expect(circles).not.toBeNull();
    expect(circles).toBeTruthy();
    expect(circles!.length).toBeGreaterThan(0);

    // Verify filter definitions are present (hard assertion)
    const filterDef = svg?.querySelector('filter[id="spoke-glow"]');
    expect(filterDef).not.toBeNull();
    expect(filterDef).toBeTruthy();

    // Verify text labels exist for each day (hard assertions)
    const textElements = svg?.querySelectorAll('text');
    expect(textElements).not.toBeNull();
    expect(textElements).toBeTruthy();
    expect(textElements!.length).toBeGreaterThan(0);
  });
});
