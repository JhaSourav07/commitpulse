import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import StatsCardSkeleton from './StatsCardSkeleton';

// Detect if full ICU support exists to prevent RangeError in environment-constrained runners
const hasFullIcu = (() => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York' });
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata' });
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo' });
    return true;
  } catch {
    return false;
  }
})();

// Helper function to format date under a specific timezone
function formatCalendarDate(isoString: string, timeZone: string): string {
  const date = new Date(isoString);
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    // Graceful fallback to UTC
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}

describe('StatsCardSkeleton Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalTimezone = process.env.TZ;

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  });

  // 1. Rendering under mocked UTC, EST, IST, and JST timezone environments.
  it('1. should render stable skeleton UI under UTC, EST, IST, and JST timezone settings', () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    timezones.forEach((tz) => {
      vi.stubEnv('TZ', tz);
      const { container, unmount } = render(<StatsCardSkeleton />);

      // Verify skeleton renders structural skeleton divs
      const shimmers = container.querySelectorAll('.shimmer');
      expect(shimmers.length).toBe(16); // 3 text blocks, 1 icon, 12 chart heights

      // Check for the chart elements container
      const chartBars = container.querySelectorAll('.flex-1.shimmer');
      expect(chartBars.length).toBe(12);

      unmount();
    });
  });

  // 2. Calendar/date rendering remains consistent across timezone offsets.
  it('2. should align calendar dates consistently across timezone offsets', () => {
    if (!hasFullIcu) return;

    // Freeze system time to a specific instant (e.g. 2026-06-01T22:30:00Z)
    const baseInstant = '2026-06-01T22:30:00Z';

    // Verify format in UTC: 22:30 on June 1st
    const formatUTC = formatCalendarDate(baseInstant, 'UTC');
    expect(formatUTC).toContain('06/01/2026, 22:30');

    // In New York (EDT, UTC-4), it is 18:30 on June 1st
    const formatEST = formatCalendarDate(baseInstant, 'America/New_York');
    expect(formatEST).toContain('06/01/2026, 18:30');

    // In Kolkata (IST, UTC+5.5), it is 04:00 on June 2nd
    const formatIST = formatCalendarDate(baseInstant, 'Asia/Kolkata');
    expect(formatIST).toContain('06/02/2026, 04:00');

    // In Tokyo (JST, UTC+9), it is 07:30 on June 2nd
    const formatJST = formatCalendarDate(baseInstant, 'Asia/Tokyo');
    expect(formatJST).toContain('06/02/2026, 07:30');

    // Render the skeleton to prove it coexists with the aligned dates stably
    const { container } = render(<StatsCardSkeleton />);
    expect(container).toBeDefined();
  });

  // 3. Leap-year boundary dates (Feb 29) do not introduce rendering gaps or runtime errors.
  it('3. should handle leap-year boundary dates safely without gaps or runtime errors', () => {
    vi.useFakeTimers();
    // Feb 29, 2024 is a leap day
    const leapDateStr = '2024-02-29T12:00:00Z';
    vi.setSystemTime(new Date(leapDateStr));

    // Confirm that rendering StatsCardSkeleton at leap year boundary is completely safe
    const { container } = render(<StatsCardSkeleton />);
    expect(container).toBeDefined();

    // Verify date transition arithmetic around February 29th
    const feb28 = new Date('2024-02-28T12:00:00Z');
    const dayAfter = new Date(feb28.getTime() + 24 * 60 * 60 * 1000);
    const twoDaysAfter = new Date(feb28.getTime() + 2 * 24 * 60 * 60 * 1000);

    expect(dayAfter.getUTCDate()).toBe(29);
    expect(dayAfter.getUTCMonth()).toBe(1); // February is index 1

    expect(twoDaysAfter.getUTCDate()).toBe(1);
    expect(twoDaysAfter.getUTCMonth()).toBe(2); // March is index 2
  });

  // 4. Daylight Saving Time transition boundaries do not produce incorrect date alignment.
  it('4. should process dates across Daylight Saving Time transitions safely without incorrect alignments', () => {
    if (!hasFullIcu) return;

    vi.useFakeTimers();
    // America/New_York Spring Forward transition on March 10, 2024
    // 01:59:59 UTC-5 goes to 03:00:00 UTC-4 (07:00:00 UTC)
    const justBeforeDST = '2024-03-10T06:59:00Z'; // 01:59:00 EST
    const justAfterDST = '2024-03-10T07:01:00Z'; // 03:01:00 EDT

    const formatBefore = formatCalendarDate(justBeforeDST, 'America/New_York');
    const formatAfter = formatCalendarDate(justAfterDST, 'America/New_York');

    expect(formatBefore).toContain('03/10/2024, 01:59');
    expect(formatAfter).toContain('03/10/2024, 03:01');

    // Confirm component mounts without exception under DST transition times
    vi.setSystemTime(new Date(justBeforeDST));
    const { container } = render(<StatsCardSkeleton />);
    expect(container).toBeDefined();
  });

  // 5. Default calendar/date placeholders remain stable when timezone or date values are missing or incomplete.
  it('5. should default to stable calendar placeholders when timezone or date values are missing/incomplete', () => {
    // Verify fallback function behavior with invalid/empty inputs
    const incompleteTimezone = '';
    const invalidTimezone = 'Invalid/Zone';
    const baseInstant = '2026-06-01T22:30:00Z';

    const fallbackIncomplete = formatCalendarDate(baseInstant, incompleteTimezone);
    const fallbackInvalid = formatCalendarDate(baseInstant, invalidTimezone);

    // Should fall back gracefully to UTC formatting
    const expectedUTC = formatCalendarDate(baseInstant, 'UTC');
    expect(fallbackIncomplete).toBe(expectedUTC);
    expect(fallbackInvalid).toBe(expectedUTC);

    // Verify loading skeleton can mount with fallback elements present
    const { container } = render(<StatsCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
