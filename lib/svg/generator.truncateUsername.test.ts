import { describe, expect, it } from 'vitest';

import { truncateUsername } from './generator';

describe('truncateUsername', () => {
  it('returns original username when length is less than 12', () => {
    expect(truncateUsername('sonal')).toBe('sonal');
  });

  it('returns original username when length is exactly 12', () => {
    expect(truncateUsername('abcdefghijkl')).toBe('abcdefghijkl');
  });

  it('truncates username longer than 12 characters with ellipsis', () => {
    expect(truncateUsername('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijkl...');
  });

  it('handles empty string input', () => {
    expect(truncateUsername('')).toBe('');
  });

  it('preserves spaces and special characters in the first 12 chars before ellipsis', () => {
    expect(truncateUsername('john doe_user+tag')).toBe('john doe_use...');
  });
});
