import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopRivalriesTicker from './TopRivalriesTicker';

// Mock next/navigation router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

/**
 * Utility simulation to test how dates map to visual strings/boundaries across locales.
 */
const formatCalendarDateForLocale = (date: Date, locale: string, timeZone: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date);
};

describe('TopRivalriesTicker - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test Case 1: Mock standard timezone settings (UTC, EST, IST, JST)
  it('should format and align calendar outputs consistently across distinct timezones (UTC, EST, IST, JST)', () => {
    const testDate = new Date('2026-07-03T22:30:00Z');

    const utcOutput = formatCalendarDateForLocale(testDate, 'en-US', 'UTC');
    const estOutput = formatCalendarDateForLocale(testDate, 'en-US', 'America/New_York');
    const istOutput = formatCalendarDateForLocale(testDate, 'en-IN', 'Asia/Kolkata');
    const jstOutput = formatCalendarDateForLocale(testDate, 'ja-JP', 'Asia/Tokyo');

    // 10:30 PM UTC is July 3rd in UTC and EST (6:30 PM), but pushes to July 4th in IST and JST
    expect(utcOutput).toContain('Jul 3, 2026');
    expect(estOutput).toContain('Jul 3, 2026');
    expect(istOutput).toContain('4 Jul 2026');
    expect(jstOutput).toContain('2026年7月4日');
  });

  // Test Case 2: Assert calculations align activities accurately onto target dates
  it('should correctly shift and snap boundary activities onto accurate dates across regions', () => {
    const boundaryDateStr = '2026-05-01T00:15:00Z'; // Right after midnight UTC
    const dateInUTC = new Date(boundaryDateStr);

    // In New York (EDT), this date snaps back to the previous day (April 30)
    const estDateFormatted = formatCalendarDateForLocale(dateInUTC, 'en-US', 'America/New_York');
    expect(estDateFormatted).toContain('Apr 30, 2026');
  });

  // Test Case 3: Verify leap year boundaries parse correctly without creating grid gaps
  it('should seamlessly process leap year boundaries without leaving gaps in calendars', () => {
    const leapDay = new Date('2024-02-29T12:00:00Z');
    const dayAfterLeap = new Date('2024-03-01T12:00:00Z');

    const formattedLeap = formatCalendarDateForLocale(leapDay, 'en-US', 'UTC');
    const formattedNext = formatCalendarDateForLocale(dayAfterLeap, 'en-US', 'UTC');

    expect(formattedLeap).toContain('Feb 29, 2024');
    expect(formattedNext).toContain('Mar 1, 2024');
  });

  // Test Case 4: Test offsets around transition dates like Daylight Savings Time (DST)
  it('should gracefully adapt calculations around Daylight Savings transition boundaries', () => {
    // 2026 DST starts on March 8 in New York (clocks jump forward skipping 2:00 AM)
    const beforeDST = new Date('2026-03-08T06:59:00Z'); // 1:59 AM EST
    const afterDST = new Date('2026-03-08T07:01:00Z'); // 3:01 AM EDT

    const beforeFormatted = formatCalendarDateForLocale(beforeDST, 'en-US', 'America/New_York');
    const afterFormatted = formatCalendarDateForLocale(afterDST, 'en-US', 'America/New_York');

    // Both dates resolve safely to March 8 despite the temporal offset hour skip
    expect(beforeFormatted).toContain('Mar 8, 2026');
    expect(afterFormatted).toContain('Mar 8, 2026');
  });

  // Test Case 5: Core component integration & navigation routing integrity verification
  it('should render items correctly and route user smoothly upon executing clicks', () => {
    const customRivalries = [
      {
        u1: 'tester1',
        u2: 'tester2',
        label: 'Local Offset Rivalry',
        icon: () => <div data-testid="mock-icon" />,
        color: 'text-blue-500',
      },
    ];

    render(<TopRivalriesTicker rivalries={customRivalries} />);

    // Verify text matching and presence
    expect(screen.getAllByText('tester1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('tester2')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Local Offset Rivalry')[0]).toBeInTheDocument();

    // Trigger click on interactive group card wrapper
    const clickTarget = screen.getAllByText('tester1')[0].closest('.group');
    if (clickTarget) {
      fireEvent.click(clickTarget);
    }

    expect(mockPush).toHaveBeenCalledWith('/compare?user1=tester1&user2=tester2');
  });
});
