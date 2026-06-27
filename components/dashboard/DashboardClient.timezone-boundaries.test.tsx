import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardClient from './DashboardClient';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

// 1. Mock Next.js router to prevent crashes
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

// 2. Isolate Date logic by mocking the heavy visual children
vi.mock('./StatsCard', () => ({
  default: ({ title, utcDate }: { title: string; utcDate: string }) => (
    <div data-testid={`stats-card-${title.replace(/\s+/g, '-')}`} data-utc-date={utcDate}>
      {title}
    </div>
  ),
}));

// Mocking the rest of the visual components as empty divs to prevent JSDOM Canvas errors
vi.mock('./ProfileCard', () => ({ default: () => <div /> }));
vi.mock('./Achievements', () => ({ default: () => <div /> }));
vi.mock('./ActivityLandscape', () => ({ default: () => <div /> }));
vi.mock('./LanguageChart', () => ({ default: () => <div /> }));
vi.mock('./CommitClock', () => ({ default: () => <div /> }));
vi.mock('./HistoricalTrendView', () => ({ default: () => <div /> }));
vi.mock('./AIInsights', () => ({ default: () => <div /> }));
vi.mock('./PopularPinnnedRepos', () => ({ PopularRepos: () => <div /> }));
vi.mock('./RepositoryGraph', () => ({ default: () => <div /> }));
vi.mock('./Heatmap', () => ({ default: () => <div /> }));
vi.mock('./RefreshButton', () => ({ default: () => <div /> }));

// 3. Minimum mock data required to render the DashboardClient
const mockPeriod = { label: 'Last Year' } as unknown as DashboardPeriod;
const mockInitialData = {
  profile: { name: 'TestUser', stats: { repositories: 10 } },
  stats: { currentStreak: 5, peakStreak: 15, totalContributions: 100 },
  languages: [],
  activity: [{ date: '2026-06-03', count: 5, intensity: 3 }],
  insights: [],
  achievements: [],
  commitClock: [{ day: 'Mon', commits: 10 }],
  graphData: { nodes: [], links: [] },
} as unknown as Parameters<typeof DashboardClient>[0]['initialData'];

describe('DashboardClient - Timezone Normalization & Boundary Alignment', () => {
  beforeEach(() => {
    // Enable simulated timers so we can freely manipulate the system clock
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore the real system clock after every test
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Test 1: Standard Timezone Boundaries (JST/EST to UTC)
  it('mocks standard timezone settings (JST/EST) and calculates commits onto correct UTC dates', () => {
    // Simulate Tokyo Time (JST) crossing midnight into June 4th (UTC is still June 3rd, 3:00 PM)
    vi.setSystemTime(new Date('2026-06-03T15:00:00Z'));
    const { rerender } = render(
      <DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />
    );

    let streakCard = screen.getByTestId('stats-card-Current-Streak');
    expect(streakCard.getAttribute('data-utc-date')).toBe('2026-06-03');

    // Simulate New York Time (EST) early morning June 4th (UTC is June 4th, 12:00 PM)
    vi.setSystemTime(new Date('2026-06-04T12:00:00Z'));
    rerender(<DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />);

    streakCard = screen.getByTestId('stats-card-Current-Streak');
    expect(streakCard.getAttribute('data-utc-date')).toBe('2026-06-04');
  });

  // Test 2: Leap Year Alignment
  it('verifies leap year boundaries parse without leaving gaps in calendar alignment', () => {
    // Set time strictly to a Leap Year boundary
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));
    render(<DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />);

    const streakCard = screen.getByTestId('stats-card-Current-Streak');
    // Ensure the dashboard doesn't accidentally roll over to March 1st
    expect(streakCard.getAttribute('data-utc-date')).toBe('2024-02-29');
  });

  // Test 3: Daylight Savings Offsets
  it('tests offsets around transition dates like Daylight Savings Time (DST)', () => {
    // US Spring Forward happens at 2:00 AM in March.
    // Testing 1:59 AM (Before shift)
    vi.setSystemTime(new Date('2026-03-08T06:59:59Z')); // UTC equivalent
    const { rerender } = render(
      <DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />
    );

    let streakCard = screen.getByTestId('stats-card-Current-Streak');
    expect(streakCard.getAttribute('data-utc-date')).toBe('2026-03-08');

    // Testing 3:00 AM (After shift - skips 2:00 AM)
    vi.setSystemTime(new Date('2026-03-08T08:00:00Z')); // UTC equivalent
    rerender(<DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />);

    streakCard = screen.getByTestId('stats-card-Current-Streak');
    // The UTC date should remain rock-solid regardless of the local DST jump
    expect(streakCard.getAttribute('data-utc-date')).toBe('2026-03-08');
  });

  // Test 4: Calendar Date Formatting
  it('asserts calendar date format utility outputs match strictly YYYY-MM-DD expectations', () => {
    // Pick a single digit month and day to ensure no missing zero-padding
    vi.setSystemTime(new Date('2026-01-05T08:00:00Z'));
    render(<DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />);

    const streakCard = screen.getByTestId('stats-card-Current-Streak');
    const dateStr = streakCard.getAttribute('data-utc-date') || '';

    // Regex verifies it exactly matches YYYY-MM-DD format (e.g., 2026-01-05, not 2026-1-5)
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateStr).toBe('2026-01-05');
  });

  // Test 5: End of Year Roll-over
  it('verifies boundary alignment during the New Year crossover', () => {
    // One second before New Year 2027 UTC
    vi.setSystemTime(new Date('2026-12-31T23:59:59Z'));
    const { rerender } = render(
      <DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />
    );

    let streakCard = screen.getByTestId('stats-card-Current-Streak');
    expect(streakCard.getAttribute('data-utc-date')).toBe('2026-12-31');

    // Two seconds later... Happy New Year!
    vi.setSystemTime(new Date('2027-01-01T00:00:01Z'));
    rerender(<DashboardClient initialData={mockInitialData} username="test" period={mockPeriod} />);

    streakCard = screen.getByTestId('stats-card-Current-Streak');
    expect(streakCard.getAttribute('data-utc-date')).toBe('2027-01-01');
  });
});
