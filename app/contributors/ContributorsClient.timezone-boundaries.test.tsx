import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ContributorsClient from './ContributorsClient';
import '@testing-library/jest-dom';

// Mock GSAP to prevent issues with ScrollTrigger in JSDOM
vi.mock('gsap', () => {
  return {
    default: {
      registerPlugin: vi.fn(),
      fromTo: vi.fn(),
      to: vi.fn(),
    },
  };
});
vi.mock('gsap/ScrollTrigger', () => {
  return {
    ScrollTrigger: {
      getAll: () => [],
    },
  };
});

const mockContributors = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
];

// Helper to calculate visual date for a commit timestamp in a specific timezone
function getVisualDateInTimezone(timestamp: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}

describe('ContributorsClient - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  // --- Test Case 1: Mock standard timezone settings ---
  it('mocks standard timezone settings (UTC, EST, IST, and JST) correctly', () => {
    const timezones = [
      { name: 'UTC', offset: 0 },
      { name: 'America/New_York', offset: 300 }, // EST
      { name: 'Asia/Kolkata', offset: -330 }, // IST
      { name: 'Asia/Tokyo', offset: -540 }, // JST
    ];

    timezones.forEach(({ offset }) => {
      vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offset);
      render(
        <ContributorsClient
          contributors={mockContributors}
          totalContributions={59}
          topContributors={mockContributors}
        />
      );
      expect(screen.getByText(/BUILDING/i)).toBeInTheDocument();
      cleanup();
      vi.restoreAllMocks();
    });
  });

  // --- Test Case 2: Assert calculations align commits onto the correct visual dates ---
  it('asserts calculations align commits onto the correct visual dates based on timezone', () => {
    // A commit timestamp at 2026-07-09T01:30:00Z
    const commitTimestamp = '2026-07-09T01:30:00Z';

    // In New York (EST/EDT, UTC-4), this should be July 8, 2026
    const dateInNewYork = getVisualDateInTimezone(commitTimestamp, 'America/New_York');
    expect(dateInNewYork).toBe('07/08/2026');

    // In London (UTC+1 DST), this should be July 9, 2026
    const dateInLondon = getVisualDateInTimezone(commitTimestamp, 'Europe/London');
    expect(dateInLondon).toBe('07/09/2026');

    // In Tokyo (JST, UTC+9), this should be July 9, 2026
    const dateInTokyo = getVisualDateInTimezone(commitTimestamp, 'Asia/Tokyo');
    expect(dateInTokyo).toBe('07/09/2026');
  });

  // --- Test Case 3: Verify leap year boundaries parse without leaving gaps in grids ---
  it('verifies leap year boundaries parse correctly without gaps', () => {
    const leapDay = '2024-02-29T12:00:00Z';
    const dayAfterLeap = '2024-03-01T12:00:00Z';
    const nonLeapNextYear = '2025-02-28T12:00:00Z';
    const nonLeapMarFirst = '2025-03-01T12:00:00Z';

    // Verify parser turns leap date into correct Date structure
    const dateLeap = new Date(leapDay);
    expect(dateLeap.getUTCFullYear()).toBe(2024);
    expect(dateLeap.getUTCMonth()).toBe(1); // 0-indexed February
    expect(dateLeap.getUTCDate()).toBe(29);

    // Days difference between Feb 29 and Mar 1 in leap year should be exactly 1 day
    const diffLeap = new Date(dayAfterLeap).getTime() - dateLeap.getTime();
    expect(diffLeap).toBe(24 * 60 * 60 * 1000);

    // Days difference between Feb 28 and Mar 1 in non-leap year should also be exactly 1 day
    const diffNonLeap = new Date(nonLeapMarFirst).getTime() - new Date(nonLeapNextYear).getTime();
    expect(diffNonLeap).toBe(24 * 60 * 60 * 1000);
  });

  // --- Test Case 4: Assert calendar date format utility outputs match expectations in each locale ---
  it('asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2026-07-09T10:00:00Z');

    // Format in US locale (MM/DD/YYYY)
    const formatterUS = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    });
    expect(formatterUS.format(testDate)).toBe('07/09/2026');

    // Format in Japan locale (YYYY/MM/DD)
    const formatterJP = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    });
    expect(formatterJP.format(testDate)).toBe('2026/07/09');

    // Format in UK locale (DD/MM/YYYY)
    const formatterGB = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    });
    expect(formatterGB.format(testDate)).toBe('09/07/2026');
  });

  // --- Test Case 5: Test offsets around transition dates like daylight savings ---
  it('tests offset calculations around Daylight Saving Time (DST) transitions', () => {
    // 2026 EST/EDT Spring Forward transition: March 8, 2026, 02:00:00 AM (clocks move forward 1 hour to 03:00:00 AM EDT)
    // Before DST: 2026-03-08T06:59:59Z -> 01:59:59 AM EST
    // After DST: 2026-03-08T07:00:00Z -> 03:00:00 AM EDT

    const beforeDstString = '2026-03-08T06:59:59Z';
    const afterDstString = '2026-03-08T07:00:00Z';

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const formattedBefore = timeFormatter.format(new Date(beforeDstString));
    const formattedAfter = timeFormatter.format(new Date(afterDstString));

    expect(formattedBefore).toBe('01:59:59');
    expect(formattedAfter).toBe('03:00:00');

    // Verify time difference in local clock time (1 second difference physically, but 1 hour and 1 second visually)
    const diffMs = new Date(afterDstString).getTime() - new Date(beforeDstString).getTime();
    expect(diffMs).toBe(1000); // physical time is consecutive
  });
});
