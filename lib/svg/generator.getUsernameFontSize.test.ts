import { describe, expect, it } from 'vitest';
import { getUsernameFontSize } from './generator';

describe('getUsernameFontSize', () => {
  it('returns 18px for usernames with length <= 12', () => {
    expect(getUsernameFontSize('octocat')).toBe(18);
    expect(getUsernameFontSize('a'.repeat(12))).toBe(18);
  });

  it('scales down font size for usernames with length > 12', () => {
    // len 13 -> 18 - (13-12)*0.5 = 17.5
    expect(getUsernameFontSize('a'.repeat(13))).toBe(17.5);
    // len 20 -> 18 - (20-12)*0.5 = 14
    expect(getUsernameFontSize('a'.repeat(20))).toBe(14);
    // len 23 (max truncated length) -> 18 - (23-12)*0.5 = 12.5
    expect(getUsernameFontSize('a'.repeat(23))).toBe(12.5);
  });

  it('clamps to a minimum font size of 10px', () => {
    // len 39 -> 18 - (39-12)*0.5 = 18 - 13.5 = 4.5 -> clamped to 10
    expect(getUsernameFontSize('a'.repeat(39))).toBe(10);
  });
});
