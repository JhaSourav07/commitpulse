import { describe, expect, it } from 'vitest';

import { truncateUsername } from './generator';

describe('truncateUsername', () => {
  it('returns original username when length is less than 20', () => {
    expect(truncateUsername('sonalkathuria')).toBe('sonalkathuria');
  });

  it('returns original username when length is exactly 20', () => {
    expect(truncateUsername('abcdefghijklmnopqrst')).toBe('abcdefghijklmnopqrst');
  });

  it('truncates username longer than 20 characters with ellipsis', () => {
    expect(truncateUsername('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijklmnopqrst...');
  });

  it('handles empty string input', () => {
    expect(truncateUsername('')).toBe('');
  });

  it('preserves spaces and special characters in the first 20 chars before ellipsis', () => {
    expect(truncateUsername('john doe_user+tag12345678')).toBe('john doe_user+tag123...');
  });
});
