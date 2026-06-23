import { describe, it, expect } from 'vitest';
import { sanitizeMongoPayload } from './sanitize';

describe('sanitizeMongoPayload', () => {
  it('should not modify normal objects', () => {
    const input = { username: 'octocat', age: 10 };
    const result = sanitizeMongoPayload(input);
    expect(result).toEqual({ username: 'octocat', age: 10 });
  });

  it('should remove keys starting with $ at the root level', () => {
    const input = { username: 'octocat', $where: 'javascript' };
    const result = sanitizeMongoPayload(input);
    expect(result).toEqual({ username: 'octocat' });
  });

  it('should recursively remove keys starting with $ from nested objects', () => {
    const input = {
      username: { $ne: 'octocat' },
      profile: {
        name: 'Octo',
        details: {
          $gt: 5,
          validKey: 'hello',
        },
      },
    };
    const result = sanitizeMongoPayload(input);
    expect(result).toEqual({
      username: {},
      profile: {
        name: 'Octo',
        details: {
          validKey: 'hello',
        },
      },
    });
  });

  it('should recursively remove keys starting with $ from arrays of objects', () => {
    const input = [
      { username: 'octocat' },
      { $gt: 'malicious' },
      { details: [{ $eq: 1 }, { val: 2 }] },
    ];
    const result = sanitizeMongoPayload(input);
    expect(result).toEqual([{ username: 'octocat' }, {}, { details: [{}, { val: 2 }] }]);
  });

  it('should handle primitives and null values safely', () => {
    expect(sanitizeMongoPayload(null)).toBeNull();
    expect(sanitizeMongoPayload(undefined)).toBeUndefined();
    expect(sanitizeMongoPayload('string')).toBe('string');
    expect(sanitizeMongoPayload(123)).toBe(123);
  });
});
