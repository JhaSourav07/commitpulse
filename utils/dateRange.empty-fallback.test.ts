/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { formatDateRange, DEFAULT_DATE_RANGE } from './dateRange';

describe('formatDateRange - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. falls back to default date range when year is completely omitted', () => {
    expect(formatDateRange()).toEqual(DEFAULT_DATE_RANGE);
  });

  it('2. falls back to default date range when year is undefined', () => {
    expect(formatDateRange(undefined)).toEqual(DEFAULT_DATE_RANGE);
  });

  it('3. falls back to default date range when year is null', () => {
    expect(formatDateRange(null as any)).toEqual(DEFAULT_DATE_RANGE);
  });

  it('4. falls back to default date range when year is an empty or whitespace string', () => {
    expect(formatDateRange('')).toEqual(DEFAULT_DATE_RANGE);
    expect(formatDateRange('   ')).toEqual(DEFAULT_DATE_RANGE);
  });

  it('5. processes numerical years correctly without throwing', () => {
    expect(formatDateRange(2024)).toEqual({
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    });

    expect(formatDateRange(24)).toEqual({
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    });
  });

  it('6. falls back to default date range when year resolves to invalid numeric bounds or NaN', () => {
    expect(formatDateRange(NaN as any)).toEqual(DEFAULT_DATE_RANGE);
    expect(formatDateRange(false as any)).toEqual(DEFAULT_DATE_RANGE);
    expect(formatDateRange({} as any)).toEqual(DEFAULT_DATE_RANGE);
  });
});
