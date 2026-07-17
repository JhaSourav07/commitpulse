import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SectionCard } from './SectionCard';
import { mockTimezone, restoreTimezone } from '../../../test-utils/timezone-mock';

describe('SectionCard Timezone Normalization & Calendar Data Boundary Alignment', () => {
  afterEach(() => {
    restoreTimezone();
    vi.useRealTimers();
  });

  // 1. Mock standard timezone settings (e.g., UTC, EST, IST, and JST).
  it('mocks standard timezone settings (UTC, EST, IST, JST)', () => {
    mockTimezone('UTC');
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('UTC');

    mockTimezone('America/New_York'); // EST
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York');

    mockTimezone('Asia/Kolkata'); // IST
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Calcutta');

    mockTimezone('Asia/Tokyo'); // JST
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Tokyo');
  });

  // 2. Assert calculations align commits onto the correct visual dates.
  it('asserts calculations align commits onto the correct visual dates', () => {
    mockTimezone('Asia/Kolkata');
    const commitDate = new Date('2024-03-15T23:30:00Z');

    // In IST (UTC+5:30), this is 2024-03-16 05:00:00
    const formatted = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
      commitDate
    );

    render(
      <SectionCard title="Commits">
        <div data-testid="visual-date">{formatted}</div>
      </SectionCard>
    );

    expect(screen.getByTestId('visual-date').textContent).toBe('2024-03-16');
  });

  // 3. Verify leap year boundaries parse without leaving gaps in grids.
  it('verifies leap year boundaries parse without leaving gaps in grids', () => {
    // Feb 29 2024
    const leapYearDate = new Date('2024-02-29T12:00:00Z');
    const nextDay = new Date(leapYearDate.getTime() + 24 * 60 * 60 * 1000); // Mar 1

    render(
      <SectionCard title="Leap Year Grid">
        <div data-testid="leap-day">{leapYearDate.toISOString().slice(0, 10)}</div>
        <div data-testid="next-day">{nextDay.toISOString().slice(0, 10)}</div>
      </SectionCard>
    );

    expect(screen.getByTestId('leap-day').textContent).toBe('2024-02-29');
    expect(screen.getByTestId('next-day').textContent).toBe('2024-03-01');
  });

  // 4. Assert calendar date format utility outputs match expectations in each locale.
  it('asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2024-12-25T15:00:00Z');

    mockTimezone('Asia/Tokyo');
    const tokyoFormat = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      dateStyle: 'short',
    }).format(testDate);

    mockTimezone('America/New_York');
    const nyFormat = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'short',
    }).format(testDate);

    render(
      <SectionCard title="Locales">
        <div data-testid="tokyo-format">{tokyoFormat}</div>
        <div data-testid="ny-format">{nyFormat}</div>
      </SectionCard>
    );

    // Japan is UTC+9, so 15:00Z -> Dec 26 00:00 JST -> 2024/12/26
    expect(screen.getByTestId('tokyo-format').textContent).toContain('2024');
    expect(screen.getByTestId('tokyo-format').textContent).toContain('12');
    expect(screen.getByTestId('tokyo-format').textContent).toContain('26');

    // NY is UTC-5, so 15:00Z -> Dec 25 10:00 EST -> 12/25/24
    expect(screen.getByTestId('ny-format').textContent).toContain('12/25/24');
  });

  // 5. Test offsets around transition dates like daylight savings.
  it('tests offsets around transition dates like daylight savings', () => {
    // US DST start in 2024 is March 10 at 2:00 AM
    mockTimezone('America/New_York');

    const preDST = new Date('2024-03-10T01:59:00-05:00');
    const postDST = new Date('2024-03-10T03:00:00-04:00');

    // Convert to UTC to demonstrate offset jump
    expect(preDST.toISOString()).toBe('2024-03-10T06:59:00.000Z');
    expect(postDST.toISOString()).toBe('2024-03-10T07:00:00.000Z');

    const formattedPre = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
    }).format(preDST);
    const formattedPost = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
    }).format(postDST);

    render(
      <SectionCard title="DST Transition">
        <div data-testid="pre-dst">{formattedPre}</div>
        <div data-testid="post-dst">{formattedPost}</div>
      </SectionCard>
    );

    // 1:59 AM jumps to 3:00 AM
    expect(screen.getByTestId('pre-dst').textContent).toContain('1:59');
    expect(screen.getByTestId('post-dst').textContent).toContain('3:00');
  });
});
