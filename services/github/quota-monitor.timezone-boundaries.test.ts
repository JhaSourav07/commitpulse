import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuotaMonitor } from './quota-monitor';

type SupportedTimezone = 'America/New_York' | 'Asia/Kolkata' | 'Asia/Tokyo' | 'UTC';

function partsForTZ(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function toVisualDateKey(date: Date, timeZone: string): string {
  const p = partsForTZ(date, timeZone);
  return `${p.year.toString().padStart(4, '0')}-${p.month.toString().padStart(2, '0')}-${p.day.toString().padStart(2, '0')}`;
}

describe('QuotaMonitor - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  let monitor: QuotaMonitor;
  const originalTimezone = process.env.TZ;

  beforeEach(() => {
    vi.useFakeTimers();
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
    process.env.TZ = 'UTC';
  });

  afterEach(() => {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Test Case 1: Mock standard timezone settings
  it('maps the same quota reset time instant to expected visual dates in New York, Kolkata, and Tokyo', () => {
    const resetTimeSeconds = 1735687800; // 2024-12-31T23:30:00.000Z

    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4000',
      'x-ratelimit-reset': String(resetTimeSeconds),
    });

    const quota = monitor.getQuota();
    expect(quota.resetTime).toBe(resetTimeSeconds * 1000);

    const resetDate = new Date(quota.resetTime);
    expect(toVisualDateKey(resetDate, 'America/New_York')).toBe('2024-12-31');
    expect(toVisualDateKey(resetDate, 'Asia/Kolkata')).toBe('2025-01-01');
    expect(toVisualDateKey(resetDate, 'Asia/Tokyo')).toBe('2025-01-01');
    expect(toVisualDateKey(resetDate, 'UTC')).toBe('2024-12-31');
  });

  // Test Case 2: Assert calculations align commits onto correct visual dates
  it('asserts calculations correctly align rate limit reset/activity dates onto correct visual dates across midnight boundaries', () => {
    const resetTimeSeconds = 1718379000; // 2024-06-14T15:30:00.000Z

    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '3000',
      'x-ratelimit-reset': String(resetTimeSeconds),
    });

    const quota = monitor.getQuota();
    const resetDate = new Date(quota.resetTime);

    expect(toVisualDateKey(resetDate, 'Asia/Tokyo')).toBe('2024-06-15');
    expect(toVisualDateKey(resetDate, 'UTC')).toBe('2024-06-14');
  });

  // Test Case 3: Verify leap year boundaries parse without leaving gaps in grids
  it('verifies leap year boundaries parse without leaving gaps in monthly visual grids', () => {
    const dates = [
      new Date('2024-02-28T19:00:00.000Z'),
      new Date('2024-02-29T19:00:00.000Z'),
      new Date('2024-03-01T19:00:00.000Z'),
    ];

    const mappedDates = dates.map((d) => toVisualDateKey(d, 'Asia/Kolkata'));
    expect(mappedDates).toEqual(['2024-02-29', '2024-03-01', '2024-03-02']);

    const gridDates: string[] = [];
    for (let day = 27; day <= 29; day++) {
      const d = new Date(Date.UTC(2024, 1, day, 12, 0, 0));
      gridDates.push(toVisualDateKey(d, 'Asia/Kolkata'));
    }
    expect(gridDates).toHaveLength(3);
    expect(gridDates[0]).toBe('2024-02-27');
    expect(gridDates[1]).toBe('2024-02-28');
    expect(gridDates[2]).toBe('2024-02-29');
  });

  // Test Case 4: Assert calendar date format utility outputs match expectations in each locale
  it('asserts calendar date formatting matches expectations in different locales (en-US vs en-GB)', () => {
    const date = new Date('2024-06-15T00:00:00.000Z');

    const usString = date.toLocaleDateString('en-US', { timeZone: 'UTC' });
    const gbString = date.toLocaleDateString('en-GB', { timeZone: 'UTC' });

    expect(usString).toMatch(/6\/?15\/?2024/);
    expect(gbString).toMatch(/15\/?06\/?2024/);
    expect(usString).not.toBe(gbString);
  });

  // Test Case 5: Test offsets around transition dates like daylight savings
  it('tests rate-limit reset offsets around Daylight Saving Time (DST) spring-forward transition in America/New_York', () => {
    const beforeBoundary = new Date('2024-03-10T06:59:59.000Z');
    const afterBoundary = new Date('2024-03-10T07:00:00.000Z');

    const beforeParts = partsForTZ(beforeBoundary, 'America/New_York');
    const afterParts = partsForTZ(afterBoundary, 'America/New_York');

    expect(beforeParts).toMatchObject({ hour: 1, minute: 59, second: 59 });
    expect(afterParts).toMatchObject({ hour: 3, minute: 0, second: 0 });

    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '2500',
      'x-ratelimit-reset': String(Math.floor(beforeBoundary.getTime() / 1000)),
    });
    expect(monitor.getQuota().resetTime).toBe(beforeBoundary.getTime());

    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '2500',
      'x-ratelimit-reset': String(Math.floor(afterBoundary.getTime() / 1000)),
    });
    expect(monitor.getQuota().resetTime).toBe(afterBoundary.getTime());
  });
});
