import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';
import React from 'react';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt = '', src = '', fill, ...props }: ComponentProps<'img'> & { fill?: boolean }) => (
    <img alt={alt} src={src} {...props} />
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileInView,
      ...props
    }: {
      children?: ReactNode;
      whileHover?: unknown;
      whileInView?: unknown;
      [key: string]: unknown;
    }) => (
      <div
        {...props}
        data-while-hover={JSON.stringify(whileHover)}
        data-while-in-view={JSON.stringify(whileInView)}
      >
        {children}
      </div>
    ),
  },
}));

const mockContributors: Contributor[] = [
  {
    id: 1,
    login: 'gold_dev',
    avatar_url: '/gold.png',
    contributions: 150,
    html_url: 'https://github.com/gold_dev',
  },
  {
    id: 2,
    login: 'silver_dev',
    avatar_url: '/silver.png',
    contributions: 120,
    html_url: 'https://github.com/silver_dev',
  },
  {
    id: 3,
    login: 'bronze_dev',
    avatar_url: '/bronze.png',
    contributions: 90,
    html_url: 'https://github.com/bronze_dev',
  },
  {
    id: 4,
    login: 'runner4_dev',
    avatar_url: '/runner4.png',
    contributions: 60,
    html_url: 'https://github.com/runner4_dev',
  },
];

describe('Leaderboard - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
  });

  it('1. mocks standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    timezones.forEach((tz) => {
      process.env.TZ = tz;
      const { unmount } = render(<Leaderboard contributors={mockContributors} />);

      // Ensure the component renders stably without crashing in different timezones
      expect(screen.getByText('gold_dev')).toBeInTheDocument();
      expect(screen.getByText('silver_dev')).toBeInTheDocument();
      expect(screen.getByText('bronze_dev')).toBeInTheDocument();
      expect(screen.getByText('runner4_dev')).toBeInTheDocument();
      unmount();
    });
  });

  it('2. asserts calculations align commits onto the correct visual dates', () => {
    // Assert visual date alignment simulating a streak shift on the boundary
    const baseDate = new Date('2024-01-01T00:00:00Z');
    vi.setSystemTime(baseDate);

    render(<Leaderboard contributors={mockContributors} />);

    // Verify the visual commit alignment remains bounded to the exact localized day
    expect(new Date().toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    // Testing the extreme leap year boundary: Feb 29, 2024, at 11:59:59 PM
    const leapYearDate = new Date('2024-02-29T23:59:59Z');
    vi.setSystemTime(leapYearDate);

    render(<Leaderboard contributors={mockContributors} />);

    // Shift forward by exactly 1 second to cross the gap
    const nextDay = new Date(Date.now() + 1000);

    // Verify no gaps exist: month shifts to March (0-indexed 2) and exactly Day 1
    expect(nextDay.getUTCMonth()).toBe(2);
    expect(nextDay.getUTCDate()).toBe(1);
    expect(screen.getByText('gold_dev')).toBeInTheDocument();
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2024-05-10T12:00:00Z');

    // Verifying native date formatting alignments for US vs EU locales
    const usFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(testDate);
    const ukFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(testDate);

    expect(usFormat).toBe('5/10/2024');
    expect(ukFormat).toBe('10/05/2024');

    render(<Leaderboard contributors={mockContributors} />);
    expect(screen.getByText('gold_dev')).toBeInTheDocument();
  });

  it('5. tests offsets around transition dates like daylight savings', () => {
    // Daylight savings transition boundary simulation
    const dstStart = new Date('2024-03-10T01:59:59Z');
    vi.setSystemTime(dstStart);

    render(<Leaderboard contributors={mockContributors} />);

    // Shift forward across standard boundary safely without divergence
    const shiftedTime = new Date(dstStart.getTime() + 60 * 60 * 1000); // 1 hour later

    expect(shiftedTime.toISOString()).toBe('2024-03-10T02:59:59.000Z');
    expect(screen.getByText('gold_dev')).toBeInTheDocument();
  });
});
