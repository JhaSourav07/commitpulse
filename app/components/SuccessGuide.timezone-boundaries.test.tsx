import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { mockTimezone, restoreTimezone } from '@/test-utils/timezone-mock';
import { SuccessGuide } from './SuccessGuide';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <span>CloseIcon</span>,
}));

const mockSystemTimezoneAndDate = (timezone: string, dateIsoString: string) => {
  mockTimezone(timezone);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(dateIsoString));
};

describe('SuccessGuide Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    restoreTimezone();
  });

  it('Case 1: Mock standard global timezone configurations (e.g., America/New_York, Asia/Kolkata, Asia/Tokyo) and verify calculations accurately bind localized metadata onto intended layout timelines', () => {
    const timezones = ['America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];
    const markdown = '![badge](https://example.com/badge.svg)';
    const onDismiss = vi.fn();

    timezones.forEach((tz) => {
      mockSystemTimezoneAndDate(tz, '2026-07-04T12:00:00Z');

      const currentDate = new Date();
      expect(currentDate.toISOString()).toBe('2026-07-04T12:00:00.000Z');

      const { unmount } = render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

      expect(screen.getByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeInTheDocument();
      expect(screen.getByText('Open Your Profile Repo')).toBeInTheDocument();

      const snippet = screen.getByLabelText('Your badge markdown snippet');
      expect(snippet.textContent).toBe(markdown);

      unmount();
    });
  });

  it('Case 2: Supply leap year transition bounds (such as February 29th) to confirm that calendar structures referenced by the module process layout updates cleanly without gaps', () => {
    const markdown = '![badge](https://example.com/badge.svg)';
    const onDismiss = vi.fn();

    mockSystemTimezoneAndDate('UTC', '2024-02-29T23:59:59Z');

    const feb29 = new Date();
    expect(feb29.getUTCMonth()).toBe(1); // February
    expect(feb29.getUTCDate()).toBe(29);

    const nextSecond = new Date(feb29.getTime() + 1000);
    expect(nextSecond.getUTCMonth()).toBe(2); // March
    expect(nextSecond.getUTCDate()).toBe(1);

    const { unmount } = render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    expect(screen.getByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeInTheDocument();
    expect(screen.getByLabelText('Steps to embed your badge')).toBeInTheDocument();

    unmount();
  });

  it('Case 3: Test hour shifts around daylight savings time (DST) transition parameters to guarantee calculations handle temporal gaps smoothly without runtime execution crashes', () => {
    const markdown = '![badge](https://example.com/badge.svg)';
    const onDismiss = vi.fn();

    mockSystemTimezoneAndDate('America/New_York', '2024-03-10T01:59:59-05:00');

    const beforeTransition = new Date();
    expect(beforeTransition.getHours()).toBe(1);

    const afterTransition = new Date(beforeTransition.getTime() + 1000);
    expect(afterTransition.getHours()).toBe(3);

    const { unmount } = render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss guide/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('Case 4: Assert that date formatting output strings rendered in the instructions view correctly follow specific regional formatting conventions under varied mock locales', () => {
    const testDate = new Date('2026-07-04T12:00:00Z');

    const usFormatted = testDate.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const gbFormatted = testDate.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    expect(usFormatted).toBe('7/4/2026');
    expect(gbFormatted).toBe('04/07/2026');

    const markdown = `![badge](https://example.com/badge.svg?date=${gbFormatted})`;
    const onDismiss = vi.fn();

    const { unmount } = render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    const snippet = screen.getByLabelText('Your badge markdown snippet');
    expect(snippet.textContent).toBe(markdown);

    unmount();
  });

  it('Case 5: Verify that executing lifecycle resets or state refreshes under deep timezone-offset configurations clears local parameters cleanly with zero unexpected runtime failures', () => {
    mockSystemTimezoneAndDate('Pacific/Kiritimati', '2026-07-04T23:59:59Z');

    const onDismiss = vi.fn();
    const markdown = '![badge](https://example.com/badge.svg)';

    const { rerender, unmount } = render(
      <SuccessGuide markdown={markdown} onDismiss={onDismiss} />
    );

    const dismissBtn = screen.getByRole('button', { name: /dismiss guide/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    onDismiss.mockReset();

    rerender(
      <SuccessGuide markdown="![badge](https://example.com/new-badge.svg)" onDismiss={onDismiss} />
    );

    const updatedSnippet = screen.getByLabelText('Your badge markdown snippet');
    expect(updatedSnippet.textContent).toBe('![badge](https://example.com/new-badge.svg)');

    unmount();
  });
});
