import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AIInsightsSkeleton from './AIInsightsSkeleton';

type TimezoneCase = {
  label: string;
  timeZone: string;
  expectedDate: string;
};

const toCalendarDate = (isoTimestamp: string, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoTimestamp));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const buildUtcMonthGrid = (year: number, monthIndex: number): string[] => {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(year, monthIndex, 1));

  while (cursor.getUTCMonth() === monthIndex) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

describe('AIInsightsSkeleton - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // 1. Mock multiple timezones (UTC, EST, IST, and JST) and verify the component renders consistently across all environments.
  it('renders consistently across multiple mocked timezones (UTC, EST, IST, and JST)', () => {
    const timeZones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];
    let baselineHtml = '';

    timeZones.forEach((timeZone) => {
      vi.stubEnv('TZ', timeZone);

      const { container, unmount } = render(<AIInsightsSkeleton />);
      const currentHtml = container.innerHTML;

      if (!baselineHtml) {
        baselineHtml = currentHtml;
      }

      // Assert visual skeleton output is identical across all timezones
      expect(currentHtml).toBe(baselineHtml);

      // Verify structure exists
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelectorAll('.flex.items-start.gap-3')).toHaveLength(3);
      expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

      unmount();
    });
  });

  // 2. Verify leap-year boundary dates (e.g. February 29) are handled correctly without rendering gaps or runtime errors.
  it('handles leap-year boundary dates correctly without rendering gaps or runtime errors', () => {
    const february2024 = buildUtcMonthGrid(2024, 1); // Feb 2024 is leap month

    expect(february2024).toHaveLength(29);
    expect(february2024[0]).toBe('2024-02-01');
    expect(february2024.at(-1)).toBe('2024-02-29');

    // Simulate system time for each day in leap month and confirm rendering stability
    february2024.forEach((dateString) => {
      vi.setSystemTime(new Date(`${dateString}T12:00:00.000Z`));

      const { container, unmount } = render(<AIInsightsSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelectorAll('.flex.items-start.gap-3')).toHaveLength(3);

      unmount();
    });
  });

  // 3. Validate timezone offset handling around date boundaries to ensure calendar alignment remains stable.
  it('validates timezone offset handling around date boundaries to ensure calendar alignment remains stable', () => {
    const utcTimestamp = '2024-03-01T00:30:00.000Z';
    const cases: TimezoneCase[] = [
      { label: 'UTC', timeZone: 'UTC', expectedDate: '2024-03-01' },
      { label: 'EST', timeZone: 'America/New_York', expectedDate: '2024-02-29' },
      { label: 'IST', timeZone: 'Asia/Kolkata', expectedDate: '2024-03-01' },
      { label: 'JST', timeZone: 'Asia/Tokyo', expectedDate: '2024-03-01' },
    ];

    cases.forEach(({ timeZone, expectedDate }) => {
      vi.stubEnv('TZ', timeZone);

      const alignedDate = toCalendarDate(utcTimestamp, timeZone);
      expect(alignedDate).toBe(expectedDate);

      // Verify components rendering handles boundary offsets cleanly
      vi.setSystemTime(new Date(utcTimestamp));
      const { container, unmount } = render(<AIInsightsSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

      unmount();
    });
  });

  // 4. Test daylight saving transition scenarios (where applicable) and confirm no unexpected rendering or calculation differences occur.
  it('tests daylight saving transition scenarios and confirms no unexpected rendering or calculation differences occur', () => {
    // EST daylight saving transition dates in 2024
    // Spring Forward: March 10, 2024
    // Autumn Fallback: November 3, 2024
    const dstTimestamps = [
      '2024-03-10T06:59:00.000Z',
      '2024-03-10T07:01:00.000Z',
      '2024-11-03T05:59:00.000Z',
      '2024-11-03T06:01:00.000Z',
    ];

    dstTimestamps.forEach((timestamp) => {
      vi.stubEnv('TZ', 'America/New_York');

      const alignedDate = toCalendarDate(timestamp, 'America/New_York');
      // The local date component should still resolve consistently to the expected day
      if (timestamp.startsWith('2024-03-10')) {
        expect(alignedDate).toBe('2024-03-10');
      } else {
        expect(alignedDate).toBe('2024-11-03');
      }

      vi.setSystemTime(new Date(timestamp));
      const { container, unmount } = render(<AIInsightsSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

      unmount();
    });
  });

  // 5. Verify fallback rendering remains stable when timezone or date-related information is missing, undefined, or incomplete.
  it('verifies fallback rendering remains stable when timezone or date-related information is missing, undefined, or incomplete', () => {
    // Mock resolvedOptions to return undefined timezone
    const spy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockImplementation(() => {
        return {
          locale: 'en-US',
          calendar: 'gregory',
          numberingSystem: 'latn',
          timeZone: undefined as unknown as string,
        };
      });

    const { container, unmount } = render(<AIInsightsSkeleton />);

    // Renders stable skeleton container and contents
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.flex.items-start.gap-3')).toHaveLength(3);
    expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

    unmount();
    spy.mockRestore();
  });
});
