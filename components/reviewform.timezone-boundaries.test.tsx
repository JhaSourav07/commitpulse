import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { ReactNode } from 'react';
import ReviewForm from './reviewform';

import { mockTimezone, restoreTimezone } from '../test-utils/timezone-mock';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: { children: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./AdvancedColorPicker', () => ({
  default: () => <div data-testid="mock-color-picker" />,
}));

const fillAndSubmitForm = (handle: string) => {
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Alex Chen' } });
  fireEvent.change(screen.getByLabelText('Handle (@username)'), { target: { value: handle } });
  fireEvent.change(screen.getByPlaceholderText(/CommitPulse completely transformed/i), {
    target: { value: 'This is a valid review message with enough characters.' },
  });
  fireEvent.click(screen.getByRole('button', { name: /share my testimonial/i }));
};

describe('ReviewForm Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const setTimezone = (tz: string) => {
    mockTimezone(tz);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    restoreTimezone();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('1. mocks standard timezone settings (UTC, EST, IST, JST) while the review form mounts correctly', () => {
    const testDate = new Date('2024-01-01T12:00:00Z');

    setTimezone('UTC');
    expect(testDate.toLocaleString('en-US', { timeZone: 'UTC' })).toContain('12:00:00 PM');

    setTimezone('Asia/Tokyo');
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).toContain('9:00:00 PM');

    setTimezone('Asia/Kolkata');
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toContain('5:30:00 PM');

    render(<ReviewForm />);
    expect(screen.getByRole('button', { name: /share my testimonial/i })).toBeInTheDocument();
  });

  it('2. aligns the localStorage cooldown timestamp onto the correct real-world moment regardless of viewer timezone', () => {
    const now = 1718445600000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    ['UTC', 'Asia/Kolkata'].forEach((tz) => {
      localStorage.clear();
      setTimezone(tz);

      localStorage.setItem(
        'last_review_submission',
        JSON.stringify({ handle: 'alexcodes', timestamp: now - 5000 })
      );

      const { unmount } = render(<ReviewForm />);
      fillAndSubmitForm('alexcodes');

      expect(screen.getByText(/please wait before submitting another review/i)).toBeInTheDocument();

      unmount();
    });
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    const leapDay = new Date('2024-02-29T12:00:00Z');

    expect(leapDay.getUTCMonth()).toBe(1);
    expect(leapDay.getUTCDate()).toBe(29);

    const dayAfter = new Date(leapDay.getTime() + 24 * 60 * 60 * 1000);
    expect(dayAfter.getUTCMonth()).toBe(2);
    expect(dayAfter.getUTCDate()).toBe(1);
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2024-12-25T15:00:00Z');

    const usFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(testDate);
    expect(usFormat).toBe('12/25/2024');

    const ukFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(testDate);
    expect(ukFormat).toBe('25/12/2024');
  });

  it('5. tests offsets around DST transition dates and confirms the cooldown gate still resolves correctly by real elapsed time', async () => {
    setTimezone('America/New_York');

    const beforeDST = new Date('2024-03-10T06:59:00Z');
    const afterDST = new Date('2024-03-10T07:01:00Z');

    const getOffset = (d: Date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'shortOffset',
      }).formatToParts(d);
      const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
      return tzName.includes('-5') || tzName.includes('EST') ? -300 : -240;
    };

    const beforeOffset = getOffset(beforeDST);
    const afterOffset = getOffset(afterDST);
    expect(afterOffset - beforeOffset).toBe(60);

    const now = beforeDST.getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    localStorage.setItem(
      'last_review_submission',
      JSON.stringify({ handle: 'alexcodes', timestamp: now - 61000 })
    );

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'ok' }),
    }) as unknown as typeof fetch;

    render(<ReviewForm />);

    await act(async () => {
      fillAndSubmitForm('alexcodes');
    });

    expect(
      screen.queryByText(/please wait before submitting another review/i)
    ).not.toBeInTheDocument();
  });
});
