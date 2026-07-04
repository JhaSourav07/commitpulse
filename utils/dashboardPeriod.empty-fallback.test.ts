/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { resolveDashboardPeriod, dashboardPeriodToSearchParams } from './dashboardPeriod';

describe('dashboardPeriod - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. resolves to rolling fallback when input is an empty object', () => {
    const result = resolveDashboardPeriod({});
    expect(result.kind).toBe('rolling');
    expect(result.label).toBe('Last 12 months');
    expect(result.from).toBeTruthy();
    expect(result.to).toBeTruthy();
  });

  it('2. resolves to rolling fallback when all input fields are undefined or null', () => {
    const result = resolveDashboardPeriod({
      year: undefined,
      month: undefined,
      from: undefined,
      to: undefined,
    });
    expect(result.kind).toBe('rolling');

    const nullResult = resolveDashboardPeriod({ year: null as any, month: null as any });
    expect(nullResult.kind).toBe('rolling');
  });

  it('3. resolves to rolling fallback when year is out of valid range', () => {
    expect(resolveDashboardPeriod({ year: '1800' }).kind).toBe('rolling');
    expect(resolveDashboardPeriod({ year: '9999' }).kind).toBe('rolling');
    expect(resolveDashboardPeriod({ year: 'abcd' }).kind).toBe('rolling');
  });

  it('4. resolves to rolling fallback when month values are invalid', () => {
    expect(resolveDashboardPeriod({ month: '2025-13' }).kind).toBe('rolling');
    expect(resolveDashboardPeriod({ month: '2025-00' }).kind).toBe('rolling');
    expect(resolveDashboardPeriod({ month: 'not-a-month' }).kind).toBe('rolling');
  });

  it('5. resolves to rolling fallback when from/to are not valid ISO dates', () => {
    expect(resolveDashboardPeriod({ from: 'not-a-date', to: 'also-not-date' }).kind).toBe(
      'rolling'
    );
    expect(resolveDashboardPeriod({ from: '', to: '' }).kind).toBe('rolling');
  });

  it('6. dashboardPeriodToSearchParams gracefully handles incomplete period objects', () => {
    const noKind = dashboardPeriodToSearchParams({
      kind: 'month',
      label: 'Test',
      from: '2025-01-01',
      to: '2025-01-31',
    });
    expect(noKind.get('from')).toBe('2025-01-01');

    const rollingParams = dashboardPeriodToSearchParams({
      kind: 'rolling',
      label: 'Test',
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-12-31T23:59:59.999Z',
    });
    expect(rollingParams.get('from')).toBe('2025-01-01T00:00:00.000Z');
    expect(rollingParams.get('to')).toBe('2025-12-31T23:59:59.999Z');
  });
});
