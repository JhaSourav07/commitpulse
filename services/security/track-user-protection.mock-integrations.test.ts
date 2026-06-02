import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackUserProtection } from './track-user-protection';
import { gitHubUserValidator } from '../github/validate-user';

vi.mock('../github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

describe('TrackUserProtection Async Service Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    trackUserProtection.reset();
    vi.clearAllMocks();
  });

  it('mocks async service layer and resolves user verification correctly', async () => {
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);

    const result = await trackUserProtection.verifyAndDeduplicate('octocat');

    expect(gitHubUserValidator.validateUser).toHaveBeenCalledTimes(1);
    expect(gitHubUserValidator.validateUser).toHaveBeenCalledWith('octocat');
    expect(result).toEqual({ allowed: true });
  });

  it('queries local cache stub before triggering async database retrieval', async () => {
    trackUserProtection.recordWrite('testuser');

    const result = await trackUserProtection.verifyAndDeduplicate('testuser');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('COOLDOWN_ACTIVE');
    expect(gitHubUserValidator.validateUser).not.toHaveBeenCalled();
  });

  it('propagates async service rejection as fallback on endpoint timeout', async () => {
    const networkError = new Error('GitHub API timeout');
    vi.mocked(gitHubUserValidator.validateUser).mockRejectedValue(networkError);

    await expect(trackUserProtection.verifyAndDeduplicate('octocat')).rejects.toThrow(
      'GitHub API timeout'
    );
  });

  it('writes cache sync state on successful record callback', async () => {
    expect(trackUserProtection.isWriteAllowed('testuser')).toBe(true);

    trackUserProtection.recordWrite('testuser');

    expect(trackUserProtection.isWriteAllowed('testuser')).toBe(false);
  });

  it('isolates cache entries per user without cross-contamination', async () => {
    trackUserProtection.recordWrite('userA');

    expect(trackUserProtection.isWriteAllowed('userA')).toBe(false);
    expect(trackUserProtection.isWriteAllowed('userB')).toBe(true);
  });
});
