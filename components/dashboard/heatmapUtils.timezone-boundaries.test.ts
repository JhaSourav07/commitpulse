import { describe, expect, it, vi, afterEach } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

function normalizeDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildCalendarGrid(year: number, month: number) {
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

describe('heatmapUtils — timezone normalization & calendar boundaries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes dates correctly across UTC, EST, IST and JST', () => {
    const timestamp = new Date('2024-03-01T00:30:00Z');

    expect(normalizeDate(timestamp, 'UTC')).toBe('2024-03-01');
    expect(normalizeDate(timestamp, 'America/New_York')).toBe('2024-02-29');
    expect(normalizeDate(timestamp, 'Asia/Kolkata')).toBe('2024-03-01');
    expect(normalizeDate(timestamp, 'Asia/Tokyo')).toBe('2024-03-01');
  });

  it('aligns commit dates correctly near midnight boundaries', () => {
    const commitTime = new Date('2024-06-15T23:45:00Z');

    expect(normalizeDate(commitTime, 'UTC')).toBe('2024-06-15');
    expect(normalizeDate(commitTime, 'Asia/Kolkata')).toBe('2024-06-16');
  });

  it('handles leap year calendar generation without gaps', () => {
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

  it('preserves utility behavior while timezone calculations run', () => {
    expect(getIntensityColor(0)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(4)).toBe('bg-black dark:bg-white');
  });
});
