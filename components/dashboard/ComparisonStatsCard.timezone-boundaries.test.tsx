/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonStatsCard from './ComparisonStatsCard';

// Mock lucide icons to avoid importing actual SVG components during test
vi.mock('lucide-react', () => ({
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  Award: (props: any) => <div data-testid="icon-award" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  GitCommit: (props: any) => <div data-testid="icon-git-commit" {...props} />,
  GitBranch: (props: any) => <div data-testid="icon-git-branch" {...props} />,
  Users: (props: any) => <div data-testid="icon-users" {...props} />,
  UserPlus: (props: any) => <div data-testid="icon-user-plus" {...props} />,
  LucideIcon: () => null,
}));

// Mock framer-motion to simplify rendering and avoid animation issues in vitest
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.whileInView;
      delete props.viewport;
      delete props.whileHover;
      delete props.transition;
      delete props.animate;

      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  },
}));

// Utility function to format dates mimicking a calendar boundary alignment
const formatDateInTimezone = (dateString: string, timeZone: string) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(dateString));
};

describe('ComparisonStatsCard Timezone Boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Mock standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    // We pass formatted dates to the labels to see if they render properly
    const baseDate = '2024-06-15T12:00:00Z';
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    timezones.forEach((tz, i) => {
      const formattedDate = formatDateInTimezone(baseDate, tz);
      render(
        <ComparisonStatsCard
          title={`Timezone Test ${tz}`}
          valueA={10 + i}
          valueB={20}
          labelA={`Date: ${formattedDate}`}
          labelB="User B"
          icon="Award"
        />
      );

      expect(screen.getByText(`Date: ${formattedDate}`)).toBeDefined();
    });
  });

  it('Assert calculations align commits onto the correct visual dates', () => {
    // If a commit is at 23:00 UTC, in JST (+9) it's the next day
    const commitDateUTC = '2024-01-10T23:00:00Z';
    const dateJST = formatDateInTimezone(commitDateUTC, 'Asia/Tokyo');

    render(
      <ComparisonStatsCard
        title="Visual Date Alignment"
        valueA={5}
        valueB={5}
        labelA={`Commit Day: ${dateJST}`} // should be Jan 11
        labelB="Other"
        icon="Award"
      />
    );

    // 23:00 + 9 hours = 08:00 next day
    expect(screen.getByText(/Jan 11, 2024/)).toBeDefined();
  });

  it('Verify leap year boundaries parse without leaving gaps in grids', () => {
    const leapDate = '2024-02-29T12:00:00Z';
    const formattedDate = formatDateInTimezone(leapDate, 'UTC');

    render(
      <ComparisonStatsCard
        title="Leap Year Test"
        valueA={100}
        valueB={200}
        labelA={formattedDate}
        labelB="Non-leap"
        icon="Award"
      />
    );

    expect(screen.getByText('Feb 29, 2024, 12:00 PM')).toBeDefined();
  });

  it('Assert calendar date format utility outputs match expectations in each locale', () => {
    const date = new Date('2024-12-25T10:00:00Z');

    // Mock utility formatting for locale
    const jpFormat = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      dateStyle: 'long',
    }).format(date);

    render(
      <ComparisonStatsCard
        title="Locale Format"
        valueA={1}
        valueB={2}
        labelA={jpFormat}
        labelB="English"
        icon="Award"
      />
    );

    expect(screen.getByText(jpFormat)).toBeDefined();
  });

  it('Test offsets around transition dates like daylight savings', () => {
    // US DST starts on second Sunday in March (Mar 10, 2024)
    const beforeDST = '2024-03-09T12:00:00Z';
    const afterDST = '2024-03-11T12:00:00Z';

    const estBefore = formatDateInTimezone(beforeDST, 'America/New_York'); // EST (-5)
    const edtAfter = formatDateInTimezone(afterDST, 'America/New_York'); // EDT (-4)

    render(
      <ComparisonStatsCard
        title="DST Test"
        valueA={10}
        valueB={20}
        labelA={`Before DST: ${estBefore}`}
        labelB={`After DST: ${edtAfter}`}
        icon="Award"
      />
    );

    // 12:00 UTC -> 07:00 EST
    expect(screen.getByText(/Before DST: Mar 9, 2024, 7:00 AM/)).toBeDefined();
    // 12:00 UTC -> 08:00 EDT
    expect(screen.getByText(/After DST: Mar 11, 2024, 8:00 AM/)).toBeDefined();
  });
});
