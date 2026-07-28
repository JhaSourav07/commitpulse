import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { SectionLabel } from './SectionLabel';

const originalTZ = process.env.TZ;

function setTimezone(isoInstant: string, tz: string) {
  process.env.TZ = tz;
  vi.setSystemTime(new Date(isoInstant));
}

describe('SectionLabel - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTZ;
  });

  it('1. renders consistently across multiple timezones', () => {
    const zones = [
      ['UTC', '2026-01-01T00:30:00Z'],
      ['America/New_York', '2025-12-31T19:30:00Z'],
      ['Asia/Kolkata', '2026-01-01T06:00:00Z'],
      ['Asia/Tokyo', '2026-01-01T09:30:00Z'],
    ] as const;

    zones.forEach(([tz, instant]) => {
      setTimezone(instant, tz);

      const { unmount } = render(<SectionLabel>Timezone Label</SectionLabel>);

      expect(screen.getByText('Timezone Label')).toBeInTheDocument();

      unmount();
    });
  });

  it('2. remains identical across calendar date boundaries', () => {
    setTimezone('2025-12-31T23:59:59Z', 'UTC');

    const { rerender } = render(<SectionLabel>Boundary Test</SectionLabel>);

    expect(screen.getByText('Boundary Test')).toBeInTheDocument();

    setTimezone('2026-01-01T00:00:01Z', 'UTC');

    rerender(<SectionLabel>Boundary Test</SectionLabel>);

    expect(screen.getByText('Boundary Test')).toBeInTheDocument();
  });

  it('3. renders correctly during leap-year dates', () => {
    setTimezone('2028-02-29T12:00:00Z', 'UTC');

    render(<SectionLabel>Leap Year</SectionLabel>);

    const label = screen.getByText('Leap Year');

    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('P');
  });

  it('4. preserves locale-independent styling across timezone changes', () => {
    setTimezone('2026-06-15T12:00:00Z', 'Asia/Kolkata');

    render(<SectionLabel>Style Test</SectionLabel>);

    const label = screen.getByText('Style Test');

    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-[0.22em]');
    expect(label.className).toContain('text-[10px]');
  });

  it('5. preserves rendered content across daylight-saving style transitions', () => {
    setTimezone('2026-03-08T01:59:59Z', 'America/New_York');

    const { rerender } = render(<SectionLabel>DST Test</SectionLabel>);

    setTimezone('2026-03-08T03:00:01Z', 'America/New_York');

    rerender(<SectionLabel>DST Test</SectionLabel>);

    expect(screen.getByText('DST Test')).toBeInTheDocument();
  });
});
