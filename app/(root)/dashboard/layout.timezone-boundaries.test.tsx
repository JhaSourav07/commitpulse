import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardLayout from './layout';
import { mockTimezone, restoreTimezone } from '@/test-utils/timezone-mock';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe('DashboardLayout - Timezone Boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    restoreTimezone();
  });

  it('maintains structural integrity across varying timezones', () => {
    const timezones = ['America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'] as const;

    for (const tz of timezones) {
      mockTimezone(tz);

      const { unmount } = render(
        <DashboardLayout>
          <div>Timezone Content: {tz}</div>
        </DashboardLayout>
      );

      expect(screen.getByText(`Timezone Content: ${tz}`)).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('max-w-[1600px]', 'mx-auto', 'min-h-screen');

      unmount();
      restoreTimezone();
    }
  });

  it('handles leap year boundaries correctly', () => {
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));

    render(
      <DashboardLayout>
        <div>Leap Year Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Leap Year Content')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});
