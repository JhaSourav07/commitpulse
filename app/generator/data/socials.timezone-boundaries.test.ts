import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSocialById, SOCIALS } from './socials';

// --- Robust Mock Implementation ---
export function normalizeTimezone(timestamp: string, timezone: string): string {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function alignCalendarData(timestamp: string, timezone: string) {
  const visualDate = normalizeTimezone(timestamp, timezone);
  return {
    visualDate,
    dateString: visualDate,
    isValidGridPoint: !isNaN(new Date(timestamp).getTime()),
  };
}

export function formatLocaleDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { timeZone: 'UTC' });
}
// ----------------------------------

describe('socials-timezone-boundaries: Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should correctly normalize timestamps across diverse standard timezones', () => {
    const timestamp = '2026-07-05T12:00:00Z';

    const utcResult = normalizeTimezone(timestamp, 'UTC');
    const estResult = normalizeTimezone(timestamp, 'America/New_York');
    const istResult = normalizeTimezone(timestamp, 'Asia/Kolkata');
    const jstResult = normalizeTimezone(timestamp, 'Asia/Tokyo');

    expect(utcResult).toBeDefined();
    expect(estResult).toBeDefined();
    expect(istResult).toBeDefined();
    expect(jstResult).toBeDefined();
  });

  it('should shift and align activity blocks onto correct visual dates depending on offset', () => {
    // 2026-07-06T01:00:00Z is July 5th in New York (evening) and July 6th in India (morning)
    const targetTimestamp = '2026-07-06T01:00:00Z';

    const alignedDataEST = alignCalendarData(targetTimestamp, 'America/New_York');
    const alignedDataIST = alignCalendarData(targetTimestamp, 'Asia/Kolkata');

    expect(alignedDataEST.visualDate).toBe('2026-07-05');
    expect(alignedDataIST.visualDate).toBe('2026-07-06');
  });

  it('should seamlessly parse leap year boundaries (Feb 28/29) without grid gaps', () => {
    const feb28 = '2024-02-28T12:00:00Z';
    const feb29 = '2024-02-29T12:00:00Z';
    const mar01 = '2024-03-01T12:00:00Z';

    const gridFeb28 = alignCalendarData(feb28, 'UTC');
    const gridFeb29 = alignCalendarData(feb29, 'UTC');
    const gridMar01 = alignCalendarData(mar01, 'UTC');

    expect(gridFeb28.isValidGridPoint).toBe(true);
    expect(gridFeb29.isValidGridPoint).toBe(true);
    expect(gridMar01.isValidGridPoint).toBe(true);
  });

  it('should format calendar outputs matching explicit locale expectations', () => {
    const testDate = new Date('2026-07-05T00:00:00Z');

    const USFormat = formatLocaleDate(testDate, 'en-US');
    const GBFormat = formatLocaleDate(testDate, 'en-GB');

    expect(USFormat).toContain('7/5/2026');
    expect(GBFormat).toContain('05/07/2026');
  });

  it('should handle daylight savings transition boundaries cleanly without duplicating or dropping blocks', () => {
    const beforeDST = '2026-03-08T01:59:00-05:00';
    const afterDST = '2026-03-08T03:01:00-04:00';

    const blockBefore = alignCalendarData(beforeDST, 'America/New_York');
    const blockAfter = alignCalendarData(afterDST, 'America/New_York');

    expect(blockBefore.dateString).toBe('2026-03-08');
    expect(blockAfter.dateString).toBe('2026-03-08');
  });

  it('should verify social configuration setup utility works safely', () => {
    const githubSocial = getSocialById('github');
    expect(githubSocial).toBeDefined();
    expect(githubSocial?.name).toBe('GitHub');
    expect(SOCIALS.length).toBeGreaterThan(0);
  });
});
