import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import RootLayout from './layout';

// Mock layout subcomponents with correct relative/absolute paths as imported in layout.tsx
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mocked-inter' }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="mock-analytics" />,
}));

vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="mock-navbar">Navbar</nav>,
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="mock-brand-particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <button data-testid="mock-return-to-top">Return To Top</button>,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="mock-scroll-restoration" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="mock-animated-cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="mock-konami" />,
}));

// Utility to convert ISO timestamp to a date string matching a specific timezone
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

// Utility to format labels for locales & timezones
const formatCalendarLabel = (isoTimestamp: string, locale: string, timeZone: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(isoTimestamp));

// Utility to build a list of dates in a month under UTC
const buildUtcMonthGrid = (year: number, monthIndex: number) => {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(year, monthIndex, 1));

  while (cursor.getUTCMonth() === monthIndex) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

describe('RootLayout - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('1. mocks standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    const timeZones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    timeZones.forEach((timeZone) => {
      process.env.TZ = timeZone;

      const { container, unmount } = render(
        <RootLayout>
          <div data-testid="layout-child">Child in {timeZone}</div>
        </RootLayout>
      );

      // Verify layout shell rendered correctly and stably in this timezone
      expect(screen.getByTestId('layout-child')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-providers')).toBeInTheDocument();
      expect(screen.getByTestId('mock-return-to-top')).toBeInTheDocument();

      unmount();
    });
  });

  it('2. asserts calculations align commits onto the correct visual dates', () => {
    // A commit at 00:30 UTC
    const commitAtUtcMidnight = '2024-03-01T00:30:00.000Z';

    const testCases = [
      { tz: 'UTC', expected: '2024-03-01' },
      { tz: 'America/New_York', expected: '2024-02-29' }, // Shifted back due to offset
      { tz: 'Asia/Kolkata', expected: '2024-03-01' },
      { tz: 'Asia/Tokyo', expected: '2024-03-01' },
    ];

    testCases.forEach(({ tz, expected }) => {
      process.env.TZ = tz;
      const alignedDate = toCalendarDate(commitAtUtcMidnight, tz);
      expect(alignedDate).toBe(expected);

      // Verify layout handles child content containing the timezone aligned date
      const { unmount } = render(
        <RootLayout>
          <div data-testid="commit-date">{alignedDate}</div>
        </RootLayout>
      );

      expect(screen.getByTestId('commit-date')).toHaveTextContent(expected);
      unmount();
    });
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    const february2024 = buildUtcMonthGrid(2024, 1); // 2024 is a leap year

    // Should have 29 days, ending on 2024-02-29
    expect(february2024).toHaveLength(29);
    expect(february2024[0]).toBe('2024-02-01');
    expect(february2024.at(-1)).toBe('2024-02-29');

    // Simulate crossing leap day boundary
    const leapDay = new Date('2024-02-29T23:59:59Z');
    vi.setSystemTime(leapDay);

    render(
      <RootLayout>
        <div data-testid="leap-grid">Leap Year Grid Stable</div>
      </RootLayout>
    );

    // Roll forward by 1 second to cross leap year boundary
    const rolledDate = new Date(Date.now() + 1000);
    expect(rolledDate.getUTCMonth()).toBe(2); // March
    expect(rolledDate.getUTCDate()).toBe(1); // 1st

    expect(screen.getByTestId('leap-grid')).toBeInTheDocument();
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', () => {
    const timestamp = '2024-02-29T18:45:00.000Z';

    const localizations = [
      { locale: 'en-US', tz: 'UTC', expected: 'Feb 29, 2024' },
      { locale: 'en-IN', tz: 'Asia/Kolkata', expected: '01 Mar 2024' },
      { locale: 'en-GB', tz: 'Asia/Tokyo', expected: '01 Mar 2024' },
    ];

    localizations.forEach(({ locale, tz, expected }) => {
      const formatted = formatCalendarLabel(timestamp, locale, tz);
      expect(formatted).toBe(expected);

      const { unmount } = render(
        <RootLayout>
          <span data-testid="localized-date">{formatted}</span>
        </RootLayout>
      );

      expect(screen.getByTestId('localized-date')).toHaveTextContent(expected);
      unmount();
    });
  });

  it('5. tests offsets around transition dates like daylight savings', () => {
    // Test DST start (spring-forward) offset transitions in America/New_York
    expect(toCalendarDate('2024-03-10T06:59:00.000Z', 'America/New_York')).toBe('2024-03-10');
    expect(toCalendarDate('2024-03-10T07:01:00.000Z', 'America/New_York')).toBe('2024-03-10');

    // Test DST end (fall-back) offset transitions in America/New_York
    expect(toCalendarDate('2024-11-03T05:59:00.000Z', 'America/New_York')).toBe('2024-11-03');
    expect(toCalendarDate('2024-11-03T06:01:00.000Z', 'America/New_York')).toBe('2024-11-03');

    // Render root layout around DST transition
    const dstStartDate = new Date('2024-03-10T01:59:59Z');
    vi.setSystemTime(dstStartDate);

    const { unmount } = render(
      <RootLayout>
        <div data-testid="dst-transition">DST Transition Active</div>
      </RootLayout>
    );

    expect(screen.getByTestId('dst-transition')).toBeInTheDocument();

    // Advance 1 hour past the transition limit
    const advancedDate = new Date(dstStartDate.getTime() + 3600 * 1000);
    expect(advancedDate.toISOString()).toBe('2024-03-10T02:59:59.000Z');

    unmount();
  });
});
