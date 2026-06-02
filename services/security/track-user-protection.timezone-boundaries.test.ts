import { describe, it, expect, vi } from 'vitest';
import { TrackUserProtection } from './track-user-protection';

describe('TrackUserProtection Timezone Normalization & Calendar Data Boundary Alignment', () => {
  it('normalizes UTC cooldown windows across time offsets', () => {
    vi.useFakeTimers();
    const tracker = TrackUserProtection.getInstance();
    tracker.reset();

    const baseTime = Date.UTC(2026, 5, 15, 12, 0, 0);
    vi.setSystemTime(baseTime);

    tracker.recordWrite('octocat');

    vi.advanceTimersByTime(60_000);

    const early = tracker.isWriteAllowed('octocat');
    expect(early).toBe(false);

    vi.advanceTimersByTime(4 * 60_000 + 1_000);

    const later = tracker.isWriteAllowed('octocat');
    expect(later).toBe(true);

    vi.useRealTimers();
  });

  it('aligns visual calendar dates across multiple timezone offsets', () => {
    const toVisualDate = (timestamp: number, timezone: string): string => {
      const d = new Date(timestamp);
      return d.toLocaleDateString('en-CA', { timeZone: timezone });
    };

    const utcMidnight = Date.UTC(2026, 5, 15, 0, 0, 0);

    expect(toVisualDate(utcMidnight, 'UTC')).toBe('2026-06-15');
    expect(toVisualDate(utcMidnight, 'America/New_York')).toBe('2026-06-14');
    expect(toVisualDate(utcMidnight, 'Asia/Kolkata')).toBe('2026-06-15');
    expect(toVisualDate(utcMidnight, 'Asia/Tokyo')).toBe('2026-06-15');
  });

  it('parses leap year boundaries without calendar gaps', () => {
    const isValidDate = (year: number, month: number, day: number): boolean => {
      const d = new Date(year, month - 1, day);
      return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
    };

    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2023, 2, 29)).toBe(false);
    expect(isValidDate(2024, 2, 28)).toBe(true);
    expect(isValidDate(2024, 3, 1)).toBe(true);
  });

  it('handles DST spring-forward transition without date drift', () => {
    const formatDate = (iso: string, tz: string): string => {
      return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz });
    };

    const dstSpringForward = '2026-03-08T06:00:00Z';
    const beforeDst = '2026-03-08T05:00:00Z';

    expect(formatDate(dstSpringForward, 'America/New_York')).toBe('2026-03-08');
    expect(formatDate(beforeDst, 'America/New_York')).toBe('2026-03-08');

    const offsetDiff =
      new Date(dstSpringForward).getTimezoneOffset() - new Date(beforeDst).getTimezoneOffset();
    expect(Math.abs(offsetDiff)).toBeLessThanOrEqual(60);
  });

  it('wraps end-of-year and month boundaries correctly', () => {
    const toVisualDate = (timestamp: number, timezone: string): string => {
      const d = new Date(timestamp);
      return d.toLocaleDateString('en-CA', { timeZone: timezone });
    };

    const dec31Utc = Date.UTC(2026, 11, 31, 23, 0, 0);
    const jan1Utc = Date.UTC(2027, 0, 1, 1, 0, 0);

    expect(toVisualDate(dec31Utc, 'UTC')).toBe('2026-12-31');
    expect(toVisualDate(jan1Utc, 'UTC')).toBe('2027-01-01');

    expect(toVisualDate(dec31Utc, 'America/New_York')).toBe('2026-12-31');
    expect(toVisualDate(jan1Utc, 'America/New_York')).toBe('2026-12-31');
  });
});
