import { describe, it, expect } from 'vitest';
import { resolveDashboardPeriod } from './dashboardPeriod';
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
