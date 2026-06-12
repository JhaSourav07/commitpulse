import { describe, it, expect } from 'vitest';
import { formatDateRange, DEFAULT_DATE_RANGE } from './dateRange';

describe('formatDateRange', () => {
  it('returns full date range for valid 4-digit year', () => {
    const result = formatDateRange('2024');
    expect(result).toEqual({
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    });
  });

  it('handles partial year with 2 digits - prepends 20', () => {
    const result = formatDateRange('24');
    expect(result).toEqual({
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    });
  });

  it('handles partial year with 1 digit - maps to 202x', () => {
    const result = formatDateRange('4');
    expect(result).toEqual({
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    });
  });

  it('returns fallback default range for empty string year', () => {
    const result = formatDateRange('');
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns fallback default range for undefined year', () => {
    const result = formatDateRange(undefined);
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns fallback default range for whitespace-only year', () => {
    const result = formatDateRange('   ');
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns fallback default range for year before GitHub founding (2008)', () => {
    const result = formatDateRange('2007');
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns fallback default range for far future year', () => {
    const result = formatDateRange('3000');
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns fallback default range for non-numeric year', () => {
    const result = formatDateRange('abc');
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns fallback default range for invalid numeric year', () => {
    const result = formatDateRange('-1');
    const currentYear = new Date().getUTCFullYear();
    expect(result).toEqual({
      from: `${currentYear}-01-01T00:00:00Z`,
      to: `${currentYear}-12-31T23:59:59Z`,
    });
  });

  it('returns correct range for GitHub founding year (2008)', () => {
    const result = formatDateRange('2008');
    expect(result).toEqual({
      from: '2008-01-01T00:00:00Z',
      to: '2008-12-31T23:59:59Z',
    });
  });

  it('returns result object matching DateRange interface', () => {
    const result = formatDateRange('2025');
    expect(result).toHaveProperty('from');
    expect(result).toHaveProperty('to');
    expect(typeof result.from).toBe('string');
    expect(typeof result.to).toBe('string');
  });

  it('DEFAULT_DATE_RANGE uses current UTC year', () => {
    const currentYear = new Date().getUTCFullYear();
    expect(DEFAULT_DATE_RANGE.from).toBe(`${currentYear}-01-01T00:00:00Z`);
    expect(DEFAULT_DATE_RANGE.to).toBe(`${currentYear}-12-31T23:59:59Z`);
  });
});
