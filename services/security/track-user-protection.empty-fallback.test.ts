import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackUserProtection } from './track-user-protection';
import { gitHubUserValidator } from '../github/validate-user';

vi.mock('../github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

describe('trackUserProtection empty/fallback cases', () => {
  beforeEach(() => {
    trackUserProtection.reset();
    vi.clearAllMocks();
  });

  it('returns INVALID_FORMAT for empty string', async () => {
    const result = await trackUserProtection.verifyAndDeduplicate('');

    expect(result).toEqual({
      allowed: false,
      reason: 'INVALID_FORMAT',
    });
  });

  it('returns INVALID_FORMAT for whitespace only input', async () => {
    const result = await trackUserProtection.verifyAndDeduplicate('   ');

    expect(result).toEqual({
      allowed: false,
      reason: 'INVALID_FORMAT',
    });
  });

  it('returns INVALID_FORMAT for username longer than 39 characters', async () => {
    const result = await trackUserProtection.verifyAndDeduplicate('a'.repeat(40));

    expect(result).toEqual({
      allowed: false,
      reason: 'INVALID_FORMAT',
    });
  });

  it('returns USER_NOT_FOUND when validator reports missing user', async () => {
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(false);

    const result = await trackUserProtection.verifyAndDeduplicate('octocat');

    expect(result).toEqual({
      allowed: false,
      reason: 'USER_NOT_FOUND',
    });
  });

  it('handles cooldown after write record', async () => {
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);

    trackUserProtection.recordWrite('octocat');

    const result = await trackUserProtection.verifyAndDeduplicate('octocat');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('COOLDOWN_ACTIVE');
    expect(result.remainingMs).toBeGreaterThan(0);
  });
});
