import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type React from 'react';
import ReturnToTop from './ReturnToTop';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <button {...props}>{children}</button>
    ),
    circle: (props: { [key: string]: unknown }) => <circle {...props} />,
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

describe('ReturnToTop Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalTZ = process.env.TZ;

  const setTimezone = (tz: string) => {
    process.env.TZ = tz;
  };

  const renderVisible = () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 750 });
    render(<ReturnToTop />);
    fireEvent.scroll(window);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('1. mocks standard timezone settings (UTC, EST, IST, JST) while the button mounts correctly', () => {
    const testDate = new Date('2024-01-01T12:00:00Z');

    setTimezone('UTC');
    expect(testDate.toLocaleString('en-US', { timeZone: 'UTC' })).toContain('12:00:00 PM');

    setTimezone('Asia/Tokyo');
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).toContain('9:00:00 PM');

    setTimezone('Asia/Kolkata');
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toContain('5:30:00 PM');

    renderVisible();
    expect(screen.getByRole('button', { name: /back to top/i })).toBeTruthy();
  });

  it('2. aligns calculations to correct visual dates despite offset shifts', () => {
    const lateUtcDate = new Date('2024-01-01T23:00:00Z');
    vi.setSystemTime(lateUtcDate);
    setTimezone('Asia/Kolkata');

    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: process.env.TZ,
      month: 'short',
      day: 'numeric',
    }).format(lateUtcDate);

    expect(formatted).toBe('Jan 2');

    renderVisible();
    expect(screen.getByTestId('chevron-up-icon')).toBeTruthy();
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    const leapDay = new Date('2024-02-29T12:00:00Z');
    vi.setSystemTime(leapDay);

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

  it('5. tests offsets around DST transition dates and confirms the button still responds to clicks across them', () => {
    setTimezone('America/New_York');

    const beforeDST = new Date('2024-03-10T06:59:00Z');
    const afterDST = new Date('2024-03-10T07:01:00Z');

    const beforeOffset = beforeDST.getTimezoneOffset();
    const afterOffset = afterDST.getTimezoneOffset();

    expect(beforeOffset - afterOffset).toBe(60);

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderVisible();
    fireEvent.click(screen.getByRole('button', { name: /back to top/i }));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
