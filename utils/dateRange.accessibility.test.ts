import { describe, it, expect } from 'vitest';
import { formatDateRange, DEFAULT_DATE_RANGE } from './dateRange';

describe('dateRange accessibility contract', () => {
  it('returns an object with accessible string values', () => {
    const result = formatDateRange('2024');

    expect(typeof result.from).toBe('string');
    expect(typeof result.to).toBe('string');
    expect(result.from.length).toBeGreaterThan(0);
    expect(result.to.length).toBeGreaterThan(0);
  });

  it('returns ISO-like UTC date strings for valid year', () => {
    const result = formatDateRange('2024');

    expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('returns consistent object structure for invalid input', () => {
    const result = formatDateRange('invalid');

    expect(Object.keys(result)).toEqual(['from', 'to']);
  });

  it('falls back to DEFAULT_DATE_RANGE for inaccessible input values', () => {
    expect(formatDateRange('')).toEqual(DEFAULT_DATE_RANGE);
    expect(formatDateRange(undefined)).toEqual(DEFAULT_DATE_RANGE);
  });

  it('maintains stable contract across supported inputs', () => {
    const inputs = ['2024', '24', '4'];

    inputs.forEach((input) => {
      const result = formatDateRange(input);

      expect(result).toHaveProperty('from');
      expect(result).toHaveProperty('to');
      expect(typeof result.from).toBe('string');
      expect(typeof result.to).toBe('string');
    });
  });
});
