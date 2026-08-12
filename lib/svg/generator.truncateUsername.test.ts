import { describe, expect, it } from 'vitest';

import { truncateUsername } from './generator';

describe('truncateUsername', () => {
  it('returns original username when length is less than 39', () => {
    expect(truncateUsername('sonalkathuria')).toBe('sonalkathuria');
  });

  it('returns original username when length is exactly 39', () => {
    const user39 = 'abcdefghijklmnopqrstuvwxyz0123456789123';
    expect(truncateUsername(user39)).toBe(user39);
  });

  it('truncates username longer than 39 characters with ellipsis', () => {
    const user42 = 'abcdefghijklmnopqrstuvwxyz0123456789123456';
    expect(truncateUsername(user42)).toBe('abcdefghijklmnopqrstuvwxyz0123456789123...');
  });

  it('handles empty string input', () => {
    expect(truncateUsername('')).toBe('');
  });

  it('preserves spaces and special characters in the first 39 chars before ellipsis', () => {
    const longString = 'john doe_user+tag123456789012345678901234567890123';
    expect(truncateUsername(longString)).toBe(longString.slice(0, 39) + '...');
  });
});
