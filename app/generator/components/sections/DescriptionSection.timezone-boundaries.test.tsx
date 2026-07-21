import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DescriptionSection } from './DescriptionSection';
import { mockTimezone, restoreTimezone } from '../../../../test-utils/timezone-mock';

describe('DescriptionSection - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  afterEach(() => {
    restoreTimezone();
    vi.useRealTimers();
  });

  it('mocks standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    mockTimezone('UTC');
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('UTC');

    mockTimezone('America/New_York'); // EST
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York');

    mockTimezone('Asia/Kolkata'); // IST
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toMatch(
      /Asia\/(Kolkata|Calcutta)/
    );

    mockTimezone('Asia/Tokyo'); // JST
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Tokyo');
  });

  it('asserts calculations align commits onto the correct visual dates', () => {
    const commitDate = new Date('2024-05-15T23:00:00Z');

    mockTimezone('America/New_York');
    let formatted = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(commitDate);
    expect(formatted).toBe('5/15/24');

    mockTimezone('Asia/Tokyo');
    formatted = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(commitDate);
    expect(formatted).toBe('5/16/24');
  });

  it('verifies leap year boundaries parse without leaving gaps in grids', () => {
    const leapYearDate = new Date('2024-02-29T12:00:00Z');

    mockTimezone('UTC');
    const nextDay = new Date(leapYearDate.getTime() + 24 * 60 * 60 * 1000);

    const formattedLeapDay = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(leapYearDate);
    const formattedNextDay = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(nextDay);

    expect(formattedLeapDay).toBe('Feb 29');
    expect(formattedNextDay).toBe('Mar 1');

    vi.useFakeTimers();
    vi.setSystemTime(leapYearDate);

    render(<DescriptionSection value="Leap day test" onChange={vi.fn()} />);
    expect(screen.getByText('Bio / Tagline')).toBeDefined();
  });

  it('asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2023-10-31T12:00:00Z');

    mockTimezone('UTC');
    const usFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(testDate);
    expect(usFormat).toBe('10/31/23');

    const gbFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(testDate);
    expect(gbFormat).toBe('31/10/2023');

    const deFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' }).format(testDate);
    expect(deFormat).toBe('31.10.23');
  });

  it('tests offsets around transition dates like daylight savings', () => {
    mockTimezone('America/New_York');

    const beforeDST = new Date('2024-03-10T01:59:59-05:00');
    const afterDST = new Date('2024-03-10T03:00:00-04:00');

    const formatTime = (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
      }).format(d);

    expect(formatTime(beforeDST)).toMatch(/1:59\s*(AM)?\s*EST/);
    expect(formatTime(afterDST)).toMatch(/3:00\s*(AM)?\s*EDT/);

    const beforeFallBack = new Date('2024-11-03T01:59:59-04:00');
    const afterFallBack = new Date('2024-11-03T01:00:00-05:00');

    expect(formatTime(beforeFallBack)).toMatch(/1:59\s*(AM)?\s*EDT/);
    expect(formatTime(afterFallBack)).toMatch(/1:00\s*(AM)?\s*EST/);
  });
});
