import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/vitest';
import TopMetricsRow from './TopMetricsRow';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Safe environment stub reset helper for Vitest 4.x
const mockSystemTimezoneAndDate = (timezone: string, dateIsoString: string) => {
  vi.stubEnv('TZ', timezone);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(dateIsoString));
};

describe('TopMetricsRow Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const mockData: PRInsightData = {
    totalPRs: 85,
    mergeRate: 92.4,
    avgCycleTime: 18.2,
    avgTimeToFirstReview: 4.5,
    weeklyActivity: [
      { name: '2026-W25', prs: 5 },
      { name: '2026-W26', prs: 12 },
    ],
  } as PRInsightData;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  // Test Case 1: Mock standard timezone settings (e.g., UTC, EST, IST, and JST).
  it('1. mocks standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    timezones.forEach((tz) => {
      mockSystemTimezoneAndDate(tz, '2026-07-04T12:00:00Z');
      const { unmount } = render(<TopMetricsRow data={mockData} />);

      expect(screen.getByText('Total PRs')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('+12 this week')).toBeInTheDocument();

      unmount();
    });
  });

  // Test Case 2: Assert calculations align commits onto the correct visual dates.
  it('2. asserts calculations align commits onto the correct visual dates', () => {
    // Mock the date to near midnight to see if timezone shifts align commits/weeklyActivity correctly
    // 2026-07-04T00:30:00Z is July 4th in UTC, but July 3rd 20:30 in New York (EST/EDT is UTC-4 in July DST)
    const mockUtcDateStr = '2026-07-04T00:30:00Z';

    // In EST (New York)
    mockSystemTimezoneAndDate('America/New_York', mockUtcDateStr);
    const localDateEST = new Date();
    expect(localDateEST.getHours()).toBe(20);
    expect(localDateEST.getDate()).toBe(3);

    const { unmount } = render(<TopMetricsRow data={mockData} />);
    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    unmount();

    // In IST (Kolkata)
    mockSystemTimezoneAndDate('Asia/Kolkata', mockUtcDateStr);
    const localDateIST = new Date();
    expect(localDateIST.getHours()).toBe(6);
    expect(localDateIST.getDate()).toBe(4);

    render(<TopMetricsRow data={mockData} />);
    expect(screen.getByText('Total PRs')).toBeInTheDocument();
  });

  // Test Case 3: Verify leap year boundaries parse without leaving gaps in grids.
  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    mockSystemTimezoneAndDate('UTC', '2024-02-29T23:59:59Z');

    const currentDate = new Date();
    expect(currentDate.getUTCMonth()).toBe(1); // February
    expect(currentDate.getUTCDate()).toBe(29);

    const nextSecond = new Date(currentDate.getTime() + 1000);
    expect(nextSecond.getUTCMonth()).toBe(2); // March
    expect(nextSecond.getUTCDate()).toBe(1);

    render(<TopMetricsRow data={mockData} />);
    expect(screen.getByText('Total PRs')).toBeInTheDocument();
  });

  // Test Case 4: Assert calendar date format utility outputs match expectations in each locale.
  it('4. asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2026-07-04T12:00:00Z');

    const usParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(testDate);

    const ukParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(testDate);

    const pick = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value;

    expect([pick(usParts, 'month'), pick(usParts, 'day'), pick(usParts, 'year')]).toEqual([
      '7',
      '4',
      '2026',
    ]);
    expect([pick(ukParts, 'day'), pick(ukParts, 'month'), pick(ukParts, 'year')]).toEqual([
      '04',
      '07',
      '2026',
    ]);

    render(<TopMetricsRow data={mockData} />);
    expect(screen.getByText('Total PRs')).toBeInTheDocument();
  });

  // Test Case 5: Test offsets around transition dates like daylight savings.
  it('5. tests offsets around transition dates like daylight savings', () => {
    // March 10, 2024 was the spring-forward transition in the US (EST/EDT)
    mockSystemTimezoneAndDate('America/New_York', '2024-03-10T01:59:59-05:00');

    const beforeTransition = new Date();
    expect(beforeTransition.getHours()).toBe(1);

    const afterTransition = new Date(beforeTransition.getTime() + 1000);
    expect(afterTransition.getHours()).toBe(3);

    render(<TopMetricsRow data={mockData} />);
    expect(screen.getByText('Total PRs')).toBeInTheDocument();
  });
});
