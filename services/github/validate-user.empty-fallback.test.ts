// services/github/validate-user.empty-fallback.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/github', () => ({
  fetchUserProfile: vi.fn(),
}));

import { fetchUserProfile } from '../../lib/github';
import { gitHubUserValidator } from './validate-user';

describe('GitHubUserValidator Empty & Missing Input Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gitHubUserValidator.reset();
  });

  it('throws for empty usernames', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    await expect(gitHubUserValidator.validateUser('')).rejects.toThrow('Cache key cannot be empty');
  });

  it('throws for whitespace-only usernames', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    await expect(gitHubUserValidator.validateUser('     ')).rejects.toThrow(
      'Cache key cannot be empty'
    );
  });

  it('caches negative results for missing users', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    const first = await gitHubUserValidator.validateUser('missing-user');
    const second = await gitHubUserValidator.validateUser('missing-user');

    expect(first).toBe(false);
    expect(second).toBe(false);

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('returns cached result for usernames with different casing and spacing', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const first = await gitHubUserValidator.validateUser('Ganesh');
    const second = await gitHubUserValidator.validateUser('  ganesh  ');

    expect(first).toBe(true);
    expect(second).toBe(true);

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('rethrows unexpected service errors instead of masking them', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('GitHub API unavailable'));

    await expect(gitHubUserValidator.validateUser('ganesh')).rejects.toThrow(
      'GitHub API unavailable'
    );
  });
});
