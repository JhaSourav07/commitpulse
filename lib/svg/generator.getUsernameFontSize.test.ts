import { describe, expect, it } from 'vitest';
import { getUsernameFontSize } from './generator';

describe('getUsernameFontSize', () => {
  it('returns 18px for usernames with length <= 12', () => {
    expect(getUsernameFontSize('octocat')).toBe(18);
    expect(getUsernameFontSize('a'.repeat(12))).toBe(18);
  });

  it('scales down font size for usernames with length > 12', () => {
    // len 13 -> 18 - (13-12)*0.3 = 17.7
    expect(getUsernameFontSize('a'.repeat(13))).toBe(17.7);
    // len 20 -> 18 - (20-12)*0.3 = 15.6
    expect(getUsernameFontSize('a'.repeat(20))).toBe(15.6);
    // len 39 (max GitHub username length) -> 18 - (39-12)*0.3 = 9.9 -> clamped to 10
    expect(getUsernameFontSize('a'.repeat(39))).toBe(10);
  });

  it('clamps to a minimum font size of 10px', () => {
    // len 50 -> 18 - (50-12)*0.3 = 6.6 -> clamped to 10
    expect(getUsernameFontSize('a'.repeat(50))).toBe(10);
  });
});
