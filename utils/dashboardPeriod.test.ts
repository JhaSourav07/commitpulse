import { describe, it, expect } from 'vitest';
import { resolveDashboardPeriod, shiftDashboardPeriod } from './dashboardPeriod';
describe('resolveDashboardPeriod', () => {
  it('parses valid month period', () => {
    const result = resolveDashboardPeriod({
      month: '2024-06',
    });

    expect(result.kind).toBe('month');
    expect(result.label).toBe('June 2024');
  });

  it('parses valid year period', () => {
    const result = resolveDashboardPeriod({
      year: '2024',
    });

    expect(result.kind).toBe('year');
    expect(result.year).toBe('2024');
  });

  it('handles leap year month correctly', () => {
    const result = resolveDashboardPeriod({
      month: '2024-02',
    });

    expect(result.kind).toBe('month');
    expect(result.to).toContain('2024-02-29');
  });

  it('falls back to rolling period for invalid month', () => {
    const result = resolveDashboardPeriod({
      month: '2024-13',
    });

    expect(result.kind).toBe('rolling');
    expect(result.label).toBe('Last 12 months');
  });

  it('creates custom range period', () => {
    const result = resolveDashboardPeriod({
      from: '2024-01-01',
      to: '2024-01-31',
    });

    expect(result.kind).toBe('range');
    expect(result.from).toContain('2024-01-01');
    expect(result.to).toContain('2024-01-31');
  });
});

describe('shiftDashboardPeriod', () => {
  it('shifts a rolling window forward without month-end overflow', () => {
    const now = new Date(Date.UTC(2026, 0, 15)); // Jan 15, 2026
    const rolling = resolveDashboardPeriod({}, now);
    expect(rolling.kind).toBe('rolling');

    const next = shiftDashboardPeriod(rolling, 'next');
    // Window moves Feb 2025..Jan 2026 -> Mar 2025..Feb 2026 (must NOT overflow to Mar 3, 2026).
    expect(next.from).toBe(new Date(Date.UTC(2025, 2, 1, 0, 0, 0, 0)).toISOString());
    expect(next.to).toBe(new Date(Date.UTC(2026, 1, 28, 23, 59, 59, 999)).toISOString());

    const spanDays = (Date.parse(next.to) - Date.parse(next.from)) / 86_400_000;
    expect(spanDays).toBeLessThan(367);
  });

  it('shifts a rolling window backward to an aligned 12-month range', () => {
    const now = new Date(Date.UTC(2026, 0, 15)); // Jan 15, 2026
    const rolling = resolveDashboardPeriod({}, now);

    const prev = shiftDashboardPeriod(rolling, 'prev');
    // Window moves to Jan 2025..Dec 2025.
    expect(prev.from).toBe(new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0)).toISOString());
    expect(prev.to).toBe(new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 999)).toISOString());
  });

  it('shifts a month period to the previous calendar month', () => {
    const month = resolveDashboardPeriod({ month: '2024-03' });
    const prev = shiftDashboardPeriod(month, 'prev');
    expect(prev.kind).toBe('month');
    expect(prev.month).toBe('2024-02');
  });
});
