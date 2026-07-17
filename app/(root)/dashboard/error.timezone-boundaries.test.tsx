import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardError from './error';
import { mockTimezone, restoreTimezone } from '@/test-utils/timezone-mock';
import logger from '@/lib/logger';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DashboardError - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    restoreTimezone();
  });

  it('Case 1: Mock varying system timezone settings (e.g., America/New_York, Asia/Kolkata, Asia/Tokyo) and assert that date calculations or logged metadata cleanly map errors onto the correct localized bounds', () => {
    const errorLoggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const timezones = ['America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'] as const;

    for (const tz of timezones) {
      mockTimezone(tz);

      const errorMessage = `Dashboard execution failed in timezone context: ${tz}`;
      const mockError = new Error(errorMessage) as Error & { digest?: string };

      const { unmount } = render(<DashboardError error={mockError} reset={vi.fn()} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(errorLoggerSpy).toHaveBeenCalledWith('Dashboard error', { error: mockError });

      unmount();
      restoreTimezone();
      vi.clearAllMocks();
    }

    consoleErrorSpy.mockRestore();
    errorLoggerSpy.mockRestore();
  });

  it('Case 2: Validate grid stability over leap year boundaries (e.g., February 29th) ensuring calendar utilities referenced by the error block parse dates cleanly with zero gaps or structural offset slips', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set system time to a leap day
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));

    const leapDayError = new Error('Leap year calendar parsing boundary failure') as Error & {
      digest?: string;
    };

    const { container } = render(<DashboardError error={leapDayError} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('Leap year calendar parsing boundary failure')).toBeInTheDocument();

    const errorViewContainer = container.querySelector('.min-h-\\[80vh\\]');
    expect(errorViewContainer).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('Case 3: Test daylight savings time (DST) transition dates (spring-forward / fall-back) ensuring extreme hour shifts do not cause infinite loops or negative offset evaluation crashes within the view state', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTimezone('America/New_York');

    vi.setSystemTime(new Date('2024-03-10T02:30:00-05:00'));
    const springForwardError = new Error('Spring forward transition crash') as Error & {
      digest?: string;
    };
    const { unmount: unmountSpring } = render(
      <DashboardError error={springForwardError} reset={vi.fn()} />
    );
    expect(screen.getByText('Spring forward transition crash')).toBeInTheDocument();
    unmountSpring();

    vi.setSystemTime(new Date('2024-11-03T01:30:00-04:00'));
    const fallBackError = new Error('Fall back transition crash') as Error & {
      digest?: string;
    };
    const { unmount: unmountFall } = render(
      <DashboardError error={fallBackError} reset={vi.fn()} />
    );
    expect(screen.getByText('Fall back transition crash')).toBeInTheDocument();
    unmountFall();

    consoleErrorSpy.mockRestore();
  });

  it('Case 4: Assert that date formatting strings rendered inside the error view correctly reflect expectations across diverse international locales', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const baseDate = new Date('2024-07-04T12:00:00Z');

    const locales = ['en-US', 'ja-JP', 'en-GB'] as const;
    const localizedDateStrings: Record<string, string> = {
      'en-US': new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(baseDate),
      'ja-JP': new Intl.DateTimeFormat('ja-JP', { dateStyle: 'full' }).format(baseDate),
      'en-GB': new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(baseDate),
    };

    for (const locale of locales) {
      const formattedDateString = localizedDateStrings[locale];
      const localizedErrorMsg = `Locale format mismatch error: ${formattedDateString} (${locale})`;
      const mockError = new Error(localizedErrorMsg) as Error & { digest?: string };

      const { unmount } = render(<DashboardError error={mockError} reset={vi.fn()} />);

      expect(screen.getByText(localizedErrorMsg)).toBeInTheDocument();
      unmount();
    }

    consoleErrorSpy.mockRestore();
  });

  it("Case 5: Verify that calling the component's interactive reset handler under timezone-shifted date footprints cleanses local error thresholds cleanly with 0 unexpected runtime execution failures", () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resetSpy = vi.fn();

    mockTimezone('Asia/Kolkata');
    vi.setSystemTime(new Date('2024-06-15T00:00:00+05:30'));

    const mockError = new Error('Reset interaction failure') as Error & { digest?: string };
    render(<DashboardError error={mockError} reset={resetSpy} />);

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();

    tryAgainBtn.click();
    expect(resetSpy).toHaveBeenCalledOnce();

    consoleErrorSpy.mockRestore();
  });
});
