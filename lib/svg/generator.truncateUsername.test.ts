import { describe, expect, it } from 'vitest';
import { truncateUsername } from './generator';

describe('truncateUsername', () => {
  it('returns username unchanged when length is less than 12', () => {
    expect(truncateUsername('riddhima')).toBe('riddhima');
  });

  it('returns username unchanged when length is exactly 12', () => {
    expect(truncateUsername('abcdefghijkl')).toBe('abcdefghijkl');
  });

  it('truncates username longer than 12 characters', () => {
    expect(truncateUsername('abcdefghijklm')).toBe('abcdefghijkl...');
  });

  it('handles empty string', () => {
    expect(truncateUsername('')).toBe('');
  });

  it('handles very long usernames consistently', () => {
    expect(truncateUsername('thisisaveryverylonggithubusername')).toBe('thisisaveryv...');
  });
});
