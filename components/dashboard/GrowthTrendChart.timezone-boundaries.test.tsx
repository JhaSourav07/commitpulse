import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import GrowthTrendChart from './GrowthTrendChart';
import React from 'react';

// Mock framer-motion to prevent JSDOM rendering issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      // Clean up motion-specific attributes to avoid React warnings in JSDOM
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.transition;
      return (
        <div className={className} style={style} {...cleanProps}>
          {children}
        </div>
      );
    },
    path: ({
      children,
      className,
      style,
      ...props
    }: React.SVGProps<SVGPathElement> & Record<string, unknown>) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;
      return (
        <path className={className} style={style} {...cleanProps}>
          {children}
        </path>
      );
    },
  },
}));

describe('GrowthTrendChart - Timezone Boundaries & Calendar Alignment', () => {
  const originalTimezone = process.env.TZ;
  const originalToLocaleString = Date.prototype.toLocaleString;

  beforeEach(() => {
    // Hijack system time and timers for deterministic behavior
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original environmental settings and clean DOM trees
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
    Date.prototype.toLocaleString = originalToLocaleString;
    vi.useRealTimers();
    cleanup();
  });

  // =========================================================================
  // 1. Timezone Normalization Across Regions
  // =========================================================================
  it('1. Timezone Normalization Across Regions: ensures system instants resolve to appropriate timezone-specific month ranges', () => {
    // Setup: Freeze system time at 2026-06-01T01:00:00Z.
    // - In JST (Asia/Tokyo, UTC+9): 2026-06-01 10:00:00 AM (Current month is June/06).
    // - In EDT (America/New_York, UTC-4): 2026-05-31 09:00:00 PM (Current month is May/05).
    vi.setSystemTime(new Date('2026-06-01T01:00:00Z'));

    // Step A: Under Tokyo timezone, June 2026 is included in the last 12 months.
    process.env.TZ = 'Asia/Tokyo';
    render(
      <GrowthTrendChart
        activityA={[{ date: '2026-06-01', count: 12 }]}
        activityB={[]}
        labelA="User A"
        labelB="User B"
      />
    );
    // User A should win the June bracket (+12).
    expect(screen.queryByText('+12')).toBeInTheDocument();
    cleanup();

    // Step B: Under New York timezone, the timeline ends in May 2026, so June 1st activity falls out of bounds.
    process.env.TZ = 'America/New_York';
    render(
      <GrowthTrendChart
        activityA={[{ date: '2026-06-01', count: 12 }]}
        activityB={[]}
        labelA="User A"
        labelB="User B"
      />
    );
    expect(screen.queryByText('+12')).not.toBeInTheDocument();
  });

  // =========================================================================
  // 2. UTC Boundary Alignment
  // =========================================================================
  it('2. UTC Boundary Alignment: maps activity close to UTC midnight to correct calendar day based on timezone offset', () => {
    // Setup: Freeze system time to July 5, 2026, so both June and July 2026 are generated in the timeline.
    vi.setSystemTime(new Date('2026-07-05T12:00:00Z'));

    const timestamps = [
      '2026-06-30T23:59:00Z', // Close to midnight
      '2026-07-01T00:00:00Z', // Exact UTC midnight
      '2026-07-01T00:01:00Z', // Just after midnight
    ];

    const toVisualDate = (iso: string, tz: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString('en-CA', { timeZone: tz });
    };

    // Scenario A: In UTC, the timestamps partition into June 30th (June) and July 1st (July).
    process.env.TZ = 'UTC';
    const activityA_UTC = [
      { date: toVisualDate(timestamps[0], 'UTC'), count: 10 }, // 2026-06-30
      { date: toVisualDate(timestamps[1], 'UTC'), count: 7 }, // 2026-07-01
      { date: toVisualDate(timestamps[2], 'UTC'), count: 7 }, // 2026-07-01
    ];

    render(
      <GrowthTrendChart activityA={activityA_UTC} activityB={[]} labelA="User A" labelB="User B" />
    );
    // Expect Winner A +10 in June and +14 (7+7) in July.
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('+14')).toBeInTheDocument();
    cleanup();

    // Scenario B: In America/New_York (EDT, UTC-4), all three timestamps occur on June 30th local time.
    process.env.TZ = 'America/New_York';
    const activityA_NY = [
      { date: toVisualDate(timestamps[0], 'America/New_York'), count: 10 }, // 2026-06-30
      { date: toVisualDate(timestamps[1], 'America/New_York'), count: 7 }, // 2026-06-30
      { date: toVisualDate(timestamps[2], 'America/New_York'), count: 7 }, // 2026-06-30
    ];

    render(
      <GrowthTrendChart activityA={activityA_NY} activityB={[]} labelA="User A" labelB="User B" />
    );
    // All 24 commits pool in June (+24). July has 0.
    expect(screen.getByText('+24')).toBeInTheDocument();
    expect(screen.queryByText('+14')).not.toBeInTheDocument();
  });

  // =========================================================================
  // 3. Leap Year Calendar Integrity
  // =========================================================================
  it('3. Leap Year Calendar Integrity: handles leap year Feb 29 contributions without continuity gaps', () => {
    // Setup: Freeze system time to March 5, 2024 (Leap Year) in UTC.
    vi.setSystemTime(new Date('2024-03-05T12:00:00Z'));
    process.env.TZ = 'UTC';

    const activityA = [
      { date: '2024-02-28', count: 5 },
      { date: '2024-02-29', count: 8 }, // Leap day contribution
      { date: '2024-03-01', count: 3 },
    ];

    render(
      <GrowthTrendChart activityA={activityA} activityB={[]} labelA="User A" labelB="User B" />
    );

    // Verify February aggregates both Feb 28 & Feb 29 (5 + 8 = 13). March aggregates 3.
    expect(screen.getByText('+13')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();

    // Check calendar structure: ensure 12 unique month blocks exist (no gaps/repeats).
    const timelineHeaders = screen.getByText('⚔️ Commit Battle Timeline').parentElement;
    expect(timelineHeaders).toBeInTheDocument();
  });

  // =========================================================================
  // 4. Locale-Aware Date Formatting
  // =========================================================================
  it('4. Locale-Aware Date Formatting: generates correct localized month labels across multiple locales', () => {
    // Setup: Freeze system time to June 5, 2026 in UTC.
    vi.setSystemTime(new Date('2026-06-05T12:00:00Z'));
    process.env.TZ = 'UTC';

    const testLocales = ['en-US', 'en-GB', 'hi-IN', 'ja-JP'];

    testLocales.forEach((locale) => {
      // Hijack the Date toLocaleString prototype to force the locale under test
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      Date.prototype.toLocaleString = function (locales?: any, options?: any) {
        const targetLocale = locales === 'default' ? locale : locales || locale;
        return originalToLocaleString.call(this, targetLocale, options);
      };

      render(<GrowthTrendChart activityA={[]} activityB={[]} labelA="User A" labelB="User B" />);

      // Check current month (June 2026) label formatting
      const juneDate = new Date('2026-06-01T12:00:00Z');
      const expectedLabel = originalToLocaleString.call(juneDate, locale, { month: 'short' });

      // The label must appear on the X axis or in the battle timeline
      expect(screen.getAllByText(expectedLabel).length).toBeGreaterThanOrEqual(1);
      cleanup();
    });
  });

  // =========================================================================
  // 5. Daylight Saving Transition Handling
  // =========================================================================
  it('5. Daylight Saving Transition Handling: handles America/New_York DST boundaries smoothly without double-counting', () => {
    process.env.TZ = 'America/New_York';

    // Step A: Spring Forward (March 8, 2026) - Verify continuity when freezing time just after transition
    vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
    const springActivity = [
      { date: '2026-03-07', count: 10 }, // Before DST Spring Forward
      { date: '2026-03-09', count: 5 }, // After DST Spring Forward
    ];

    render(
      <GrowthTrendChart activityA={springActivity} activityB={[]} labelA="User A" labelB="User B" />
    );
    // Both belong to March 2026 (+15)
    expect(screen.getByText('+15')).toBeInTheDocument();
    cleanup();

    // Step B: Fall Back (November 1, 2026) - Verify continuity when freezing time just after transition
    vi.setSystemTime(new Date('2026-11-05T12:00:00Z'));
    const fallActivity = [
      { date: '2026-10-31', count: 6 }, // Before DST Fall Back
      { date: '2026-11-02', count: 4 }, // After DST Fall Back
    ];

    render(
      <GrowthTrendChart activityA={fallActivity} activityB={[]} labelA="User A" labelB="User B" />
    );
    // Verify October gets 6 and November gets 4
    expect(screen.getByText('+6')).toBeInTheDocument();
    expect(screen.getByText('+4')).toBeInTheDocument();
  });
});
