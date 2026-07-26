import { describe, it, expect } from 'vitest';
import {
  resolveDashboardPeriod,
  shiftDashboardPeriod,
  dashboardPeriodToSearchParams,
} from './dashboardPeriod';

describe('dashboardPeriod - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  const refNow = new Date(Date.UTC(2025, 5, 15, 10, 0, 0));

  it('resolveDashboardPeriod parses a custom range from valid ISO date inputs', () => {
    const period = resolveDashboardPeriod(
      { from: '2025-03-01T00:00:00.000Z', to: '2025-03-31T23:59:59.999Z' },
      refNow
    );
    expect(period.kind).toBe('range');
    expect(period.from).toContain('2025-03-01');
    expect(period.to).toContain('2025-03-31');
  });

  it('resolveDashboardPeriod resolves a month period from YYYY-MM input', () => {
    const period = resolveDashboardPeriod({ month: '2025-04' }, refNow);
    expect(period.kind).toBe('month');
    expect(period.month).toBe('2025-04');
    expect(period.from).toContain('2025-04-01');
    expect(period.to).toContain('2025-04-30');
    expect(period.label).toContain('April');
  });

  it('resolveDashboardPeriod resolves a year or falls back to rolling 12 months', () => {
    const yearPeriod = resolveDashboardPeriod({ year: '2024' }, refNow);
    expect(yearPeriod.kind).toBe('year');
    expect(yearPeriod.year).toBe('2024');
    expect(yearPeriod.from).toContain('2024-01-01');

    const invalidYear = resolveDashboardPeriod({ year: '1800' }, refNow);
    expect(invalidYear.kind).toBe('rolling');
    expect(invalidYear.label).toBe('Last 12 months');

    const emptyInput = resolveDashboardPeriod({}, refNow);
    expect(emptyInput.kind).toBe('rolling');
  });

  it('shiftDashboardPeriod moves month periods forward and year periods backward', () => {
    const monthPeriod = resolveDashboardPeriod({ month: '2025-04' }, refNow);
    const nextMonth = shiftDashboardPeriod(monthPeriod, 'next');
    expect(nextMonth.kind).toBe('month');
    expect(nextMonth.month).toBe('2025-05');

    const prevMonth = shiftDashboardPeriod(monthPeriod, 'prev');
    expect(prevMonth.month).toBe('2025-03');

    const yearPeriod = resolveDashboardPeriod({ year: '2024' }, refNow);
    const nextYear = shiftDashboardPeriod(yearPeriod, 'next');
    expect(nextYear.year).toBe('2025');

    const rollingPeriod = resolveDashboardPeriod({}, refNow);
    const prevRolling = shiftDashboardPeriod(rollingPeriod, 'prev');
    expect(prevRolling.kind).toBe('range');
    expect(prevRolling.from).not.toBe(rollingPeriod.from);
  });

  it('dashboardPeriodToSearchParams serialises each period kind correctly', () => {
    const monthPeriod = resolveDashboardPeriod({ month: '2025-04' }, refNow);
    const monthParams = dashboardPeriodToSearchParams(monthPeriod);
    expect(monthParams.get('month')).toBe('2025-04');
    expect(monthParams.get('year')).toBeNull();

    const yearPeriod = resolveDashboardPeriod({ year: '2024' }, refNow);
    const yearParams = dashboardPeriodToSearchParams(yearPeriod);
    expect(yearParams.get('year')).toBe('2024');

    const rangePeriod = resolveDashboardPeriod(
      { from: '2025-06-01T00:00:00.000Z', to: '2025-06-30T23:59:59.999Z' },
      refNow
    );
    const rangeParams = dashboardPeriodToSearchParams(rangePeriod);
    expect(rangeParams.get('from')).toContain('2025-06-01');
    expect(rangeParams.get('to')).toContain('2025-06-30');
  });
});
