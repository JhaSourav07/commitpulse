// services/github/validate-user.mock-integrations.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/github', () => ({
  fetchUserProfile: vi.fn(),
}));

import { fetchUserProfile } from '../../lib/github';
import { gitHubUserValidator } from './validate-user';

describe('GitHubUserValidator Mock Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gitHubUserValidator.reset();
  });

  it('loads user data through mocked async service', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const result = await gitHubUserValidator.validateUser('ganesh');

    expect(result).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('queries cache before triggering another service request', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    await gitHubUserValidator.validateUser('ganesh');
    await gitHubUserValidator.validateUser('ganesh');

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('stores successful validation results in cache', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const first = await gitHubUserValidator.validateUser('ganesh');
    const second = await gitHubUserValidator.validateUser('ganesh');

    expect(first).toBe(true);
    expect(second).toBe(true);

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('caches negative lookup results from mocked service', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    const first = await gitHubUserValidator.validateUser('missing-user');
    const second = await gitHubUserValidator.validateUser('missing-user');

    expect(first).toBe(false);
    expect(second).toBe(false);

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('falls back correctly when async endpoint returns temporary failure', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('GitHub API timeout'));

    await expect(gitHubUserValidator.validateUser('ganesh')).rejects.toThrow('GitHub API timeout');

    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });
});
