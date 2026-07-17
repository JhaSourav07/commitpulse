import { describe, it, expect, vi, afterEach } from 'vitest';

function normalizeDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildCalendarGrid(year: number, month: number) {
  const days = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

describe('PopularRepos — timezone normalization & calendar boundary alignment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes same UTC timestamp correctly across UTC, EST, IST and JST', () => {
    const timestamp = new Date('2024-03-01T00:30:00Z');

    expect(normalizeDate(timestamp, 'UTC')).toBe('2024-03-01');
    expect(normalizeDate(timestamp, 'America/New_York')).toBe('2024-02-29');
    expect(normalizeDate(timestamp, 'Asia/Kolkata')).toBe('2024-03-01');
    expect(normalizeDate(timestamp, 'Asia/Tokyo')).toBe('2024-03-01');
  });

  it('keeps commits aligned to correct visual day near midnight offsets', () => {
    const commitTime = new Date('2024-06-15T23:45:00Z');

    const utc = normalizeDate(commitTime, 'UTC');
    const india = normalizeDate(commitTime, 'Asia/Kolkata');
    const japan = normalizeDate(commitTime, 'Asia/Tokyo');

    expect(utc).toBe('2024-06-15');
    expect(india).toBe('2024-06-16');
    expect(japan).toBe('2024-06-16');
  });

  it('builds leap year February grid without missing dates', () => {
    const feb2024 = buildCalendarGrid(2024, 1);

    expect(feb2024).toHaveLength(29);
    expect(feb2024[0]).toBe('2024-02-01');
    expect(feb2024[28]).toBe('2024-02-29');
  });

  it('returns locale formatted calendar dates consistently', () => {
    const date = new Date('2024-12-25T12:00:00Z');

    const us = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
    }).format(date);

    const gb = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
    }).format(date);

    expect(us).toBe('12/25/2024');
    expect(gb).toBe('25/12/2024');
  });

  it('handles daylight saving boundary transitions safely', () => {
    const beforeDST = new Date('2024-03-10T06:59:00Z');
    const afterDST = new Date('2024-03-10T07:01:00Z');

    const before = normalizeDate(beforeDST, 'America/New_York');
    const after = normalizeDate(afterDST, 'America/New_York');

    // Same calendar day should remain stable across DST jump
    expect(before).toBe('2024-03-10');
    expect(after).toBe('2024-03-10');
  });
});
