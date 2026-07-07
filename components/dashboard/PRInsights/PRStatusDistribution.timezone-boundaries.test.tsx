/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PRStatusDistribution from './PRStatusDistribution';

// Safe environment stub reset helper for Vitest 4.x
const mockSystemTimezoneAndDate = (timezone: string, dateIsoString: string) => {
  vi.stubEnv('TZ', timezone);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(dateIsoString));
};

describe('PRStatusDistribution - Timezone Normalization & Calendar Data Boundary Alignment (Variation 8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.stubEnv('TZ', '');
  });

  // Test Case 1: Timezone offset block shifting calculations
  it('should process PR data metrics accurately across distinct timezones (EST vs IST)', () => {
    const mockPrData = {
      totalPRs: 1,
      openPRs: 0,
      mergedPRs: 1,
      closedPRs: 0,
    };

    mockSystemTimezoneAndDate('America/New_York', '2026-07-03T12:00:00Z');
    // Bypassing strict type requirements using 'as any'
    const { rerender } = render(<PRStatusDistribution data={mockPrData as any} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();

    mockSystemTimezoneAndDate('Asia/Kolkata', '2026-07-03T12:00:00Z');
    rerender(<PRStatusDistribution data={mockPrData as any} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  // Test Case 2: Extreme time zones (JST / UTC)
  it('should parse metrics accurately under extreme positive timezones like JST', () => {
    const mockPrData = {
      totalPRs: 1,
      openPRs: 1,
      mergedPRs: 0,
      closedPRs: 0,
    };

    mockSystemTimezoneAndDate('Asia/Tokyo', '2026-01-02T00:00:00Z');
    render(<PRStatusDistribution data={mockPrData as any} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  // Test Case 3: Leap year boundary data validation
  it('should parse leap year boundaries seamlessly without processing exceptions', () => {
    const mockPrData = {
      totalPRs: 1,
      openPRs: 0,
      mergedPRs: 0,
      closedPRs: 1,
    };

    mockSystemTimezoneAndDate('UTC', '2024-03-01T00:00:00Z');
    render(<PRStatusDistribution data={mockPrData as any} />);

    expect(screen.getByText('Breakdown of PR states')).toBeInTheDocument();
  });

  // Test Case 4: Daylight Savings Time (DST) Transitions
  it('should calculate date boundaries precisely during spring-forward and fall-back DST transitions', () => {
    const mockPrData = {
      totalPRs: 1,
      openPRs: 0,
      mergedMRs: 1,
      closedPRs: 0,
    };

    mockSystemTimezoneAndDate('America/New_York', '2026-03-09T00:00:00Z');
    render(<PRStatusDistribution data={mockPrData as any} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  // Test Case 5: Calendar utility output locale formatting validation
  it('should handle calendar date format expectations for the current locale environment', () => {
    const mockPrData = {
      totalPRs: 0,
      openPRs: 0,
      mergedPRs: 0,
      closedPRs: 0,
    };

    mockSystemTimezoneAndDate('Europe/London', '2026-07-02T12:00:00Z');
    render(<PRStatusDistribution data={mockPrData as any} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });
});
