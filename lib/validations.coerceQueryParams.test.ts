import { describe, it, expect } from 'vitest';
import { coerceQueryParams } from './validations';

describe('coerceQueryParams', () => {
  it('collapses array values in plain objects to their first element', () => {
    const input = {
      user: ['octocat', 'git'],
      theme: 'dark',
      bg: ['0d1117'],
      radius: undefined,
    };
    const expected = {
      user: 'octocat',
      theme: 'dark',
      bg: '0d1117',
      radius: undefined,
    };
    expect(coerceQueryParams(input)).toEqual(expected);
  });

  it('keeps single string values unchanged in plain objects', () => {
    const input = {
      user: 'octocat',
      theme: 'light',
    };
    expect(coerceQueryParams(input)).toEqual(input);
  });

  it('coerces URLSearchParams to retrieve the first occurrence of duplicate keys', () => {
    const searchParams = new URLSearchParams('user=octocat&user=git&theme=dark');
    const expected = {
      user: 'octocat',
      theme: 'dark',
    };
    expect(coerceQueryParams(searchParams)).toEqual(expected);
  });

  it('handles empty parameters gracefully', () => {
    expect(coerceQueryParams({})).toEqual({});
    expect(coerceQueryParams(new URLSearchParams())).toEqual({});
  });
});
