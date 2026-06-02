import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gitHubUserValidator } from './validate-user';
import { fetchUserProfile } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  fetchUserProfile: vi.fn(),
}));

describe('GitHubUserValidator', () => {
  beforeEach(() => {
    gitHubUserValidator.reset();
    vi.clearAllMocks();
  });

  it('returns true for an existing GitHub user', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const result = await gitHubUserValidator.validateUser('octocat');

    expect(result).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('returns false when GitHub reports user not found', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    const result = await gitHubUserValidator.validateUser('missing-user');

    expect(result).toBe(false);
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('caches successful validation results', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    await gitHubUserValidator.validateUser('octocat');
    await gitHubUserValidator.validateUser('octocat');

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('caches negative validation results', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    await gitHubUserValidator.validateUser('ghost-user');
    await gitHubUserValidator.validateUser('ghost-user');

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('rethrows temporary GitHub API errors without caching', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('GitHub API rate limit exceeded'));

    await expect(gitHubUserValidator.validateUser('octocat')).rejects.toThrow(
      'GitHub API rate limit exceeded'
    );

    await expect(gitHubUserValidator.validateUser('octocat')).rejects.toThrow(
      'GitHub API rate limit exceeded'
    );

    expect(fetchUserProfile).toHaveBeenCalledTimes(2);
  });
});
