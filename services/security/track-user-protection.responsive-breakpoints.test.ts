import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackUserProtection } from './track-user-protection';
import { gitHubUserValidator } from '../github/validate-user';

vi.mock('../github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

describe('TrackUserProtection Service Logic', () => {
  beforeEach(() => {
    trackUserProtection.reset();
    vi.clearAllMocks();
  });

  it('accepts valid GitHub usernames', () => {
    expect(trackUserProtection.validateFormat('octocat')).toBe(true);
    expect(trackUserProtection.validateFormat('test-user')).toBe(true);
  });

  it('rejects invalid GitHub usernames', () => {
    expect(trackUserProtection.validateFormat('-octocat')).toBe(false);
    expect(trackUserProtection.validateFormat('octocat-')).toBe(false);
  });

  it('blocks writes during cooldown period', () => {
    trackUserProtection.recordWrite('octocat');
    expect(trackUserProtection.isWriteAllowed('octocat')).toBe(false);
  });

  it('reset clears cooldown state', () => {
    trackUserProtection.recordWrite('octocat');
    trackUserProtection.reset();

    expect(trackUserProtection.isWriteAllowed('octocat')).toBe(true);
  });

  it('returns allowed true for valid existing user', async () => {
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);

    const result = await trackUserProtection.verifyAndDeduplicate('octocat');

    expect(result).toEqual({ allowed: true });
  });
});
