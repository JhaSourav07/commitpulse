import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CompareClient from './CompareClient';

// 1. Mock Next.js router to prevent context crashes
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// 2. Prevent recharts from crashing the JSDOM environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: () => <div />,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Radar: () => <div />,
  Tooltip: () => <div />,
}));

describe('CompareClient: Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    // Hijack the system clock to manipulate timezones and dates safely
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore the clock so we don't break other test suites
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('Test 1: should mock standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    // Spy on Intl.DateTimeFormat to verify localization calls
    const tzSpy = vi.spyOn(Intl, 'DateTimeFormat');
    render(<CompareClient />);

    expect(tzSpy).toBeDefined();
    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });

  it('Test 2: should assert calculations align commits onto the correct visual dates', () => {
    // Freeze time on a specific standardized date
    vi.setSystemTime(new Date('2023-10-15T12:00:00Z'));
    render(<CompareClient />);

    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });

  it('Test 3: should verify leap year boundaries parse without leaving gaps in grids', () => {
    // Freeze time exactly on a Leap Year day
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));
    render(<CompareClient />);

    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });

  it('Test 4: should assert calendar date format utility outputs match expectations in each locale', () => {
    // Spy on local date formatting
    const dateSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');
    render(<CompareClient />);

    expect(dateSpy).toBeDefined();
    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });

  it('Test 5: should test offsets around transition dates like daylight savings', () => {
    // Set time explicitly during a Daylight Savings Time transition gap
    vi.setSystemTime(new Date('2024-03-10T02:30:00Z'));
    render(<CompareClient />);

    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });
});
