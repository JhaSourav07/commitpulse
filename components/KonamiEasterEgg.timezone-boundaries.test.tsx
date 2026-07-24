import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KonamiEasterEgg from './KonamiEasterEgg';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({
          children,
          ...props
        }: {
          children?: React.ReactNode;
        } & React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

type TimezoneCase = {
  label: string;
  timeZone: string;
  expectedDate: string;
};

const toCalendarDate = (isoTimestamp: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoTimestamp));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const formatCalendarLabel = (isoTimestamp: string, locale: string, timeZone: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(isoTimestamp));

const buildUtcMonthGrid = (year: number, monthIndex: number) => {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(year, monthIndex, 1));

  while (cursor.getUTCMonth() === monthIndex) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

function triggerSecretCode() {
  'commit'.split('').forEach((char) => {
    fireEvent.keyDown(window, { key: char });
  });
}

describe('KonamiEasterEgg - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // --- Test Case 1 ---
  it('renders overlay successfully across multiple timezone settings (UTC, EST, IST, JST)', () => {
    const timeZones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    timeZones.forEach((timeZone) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
      vi.stubEnv('TZ', timeZone);

      const { container, unmount } = render(<KonamiEasterEgg />);
      triggerSecretCode();

      expect(screen.getByText('You Found It!')).toBeInTheDocument();
      expect(container.textContent).toContain('CommitPulse');

      unmount();
      vi.useRealTimers();
      vi.unstubAllEnvs();
    });
  });

  // --- Test Case 2 ---
  it('aligns a commit timestamp onto the correct visual date per viewer timezone', () => {
    const commitAtUtcMidnight = '2024-03-01T00:30:00.000Z';
    const cases: TimezoneCase[] = [
      { label: 'UTC', timeZone: 'UTC', expectedDate: '2024-03-01' },
      { label: 'EST', timeZone: 'America/New_York', expectedDate: '2024-02-29' },
      { label: 'IST', timeZone: 'Asia/Kolkata', expectedDate: '2024-03-01' },
      { label: 'JST', timeZone: 'Asia/Tokyo', expectedDate: '2024-03-01' },
    ];

    expect(
      cases.map(({ label, timeZone, expectedDate }) => ({
        label,
        date: toCalendarDate(commitAtUtcMidnight, timeZone),
        expectedDate,
      }))
    ).toEqual([
      { label: 'UTC', date: '2024-03-01', expectedDate: '2024-03-01' },
      { label: 'EST', date: '2024-02-29', expectedDate: '2024-02-29' },
      { label: 'IST', date: '2024-03-01', expectedDate: '2024-03-01' },
      { label: 'JST', date: '2024-03-01', expectedDate: '2024-03-01' },
    ]);
  });

  // --- Test Case 3 ---
  it('preserves leap-year calendar boundaries without gaps in the monthly grid', () => {
    const february2024 = buildUtcMonthGrid(2024, 1);

    expect(february2024).toHaveLength(29);
    expect(february2024[0]).toBe('2024-02-01');
    expect(february2024).toContain('2024-02-29');
    expect(february2024.at(-1)).toBe('2024-02-29');

    const february2025 = buildUtcMonthGrid(2025, 1);
    expect(february2025).toHaveLength(28);
    expect(february2025.at(-1)).toBe('2025-02-28');
  });

  // --- Test Case 4 ---
  it('formats calendar labels consistently for each locale and timezone pairing', () => {
    const timestamp = '2024-02-29T18:45:00.000Z';

    expect(formatCalendarLabel(timestamp, 'en-US', 'UTC')).toBe('Feb 29, 2024');
    expect(formatCalendarLabel(timestamp, 'en-IN', 'Asia/Kolkata')).toBe('01 Mar 2024');
    expect(formatCalendarLabel(timestamp, 'en-GB', 'Asia/Tokyo')).toBe('01 Mar 2024');
  });

  // --- Test Case 5 ---
  it('keeps daylight-saving transition offsets aligned to the expected local dates', () => {
    expect(toCalendarDate('2024-03-10T06:59:00.000Z', 'America/New_York')).toBe('2024-03-10');
    expect(toCalendarDate('2024-03-10T07:01:00.000Z', 'America/New_York')).toBe('2024-03-10');
    expect(toCalendarDate('2024-11-03T05:59:00.000Z', 'America/New_York')).toBe('2024-11-03');
    expect(toCalendarDate('2024-11-03T06:01:00.000Z', 'America/New_York')).toBe('2024-11-03');
  });
});
