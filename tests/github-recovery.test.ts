import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchGitHubContributions,
  fetchUserProfile,
  fetchUserRepos,
  getJitteredBackoff,
  clearGitHubApiCacheForTests,
} from '../lib/github';

function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('GitHub API Failure Recovery (Phase 3)', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    vi.spyOn(global, 'fetch');
    process.env.GITHUB_PAT = 'ghp_testtokenAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearGitHubApiCacheForTests();
  });

  describe('Jittered Backoff Calculations', () => {
    it('verifies that getJitteredBackoff returns values within the correct bounds', () => {
      // Attempt 0: base delay = 500ms. Bounds: [250, 500]
      for (let i = 0; i < 100; i++) {
        const delay = getJitteredBackoff(0);
        expect(delay).toBeGreaterThanOrEqual(250);
        expect(delay).toBeLessThanOrEqual(500);
      }

      // Attempt 1: base delay = 1000ms. Bounds: [500, 1000]
      for (let i = 0; i < 100; i++) {
        const delay = getJitteredBackoff(1);
        expect(delay).toBeGreaterThanOrEqual(500);
        expect(delay).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe('fetchUserProfile Fallback', () => {
    it('falls back to stale cache data on network failure', async () => {
      // 1. Populate cache with a successful fetch first
      vi.mocked(fetch).mockResolvedValueOnce(
        mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'https://github.com/octocat.png',
          public_repos: 8,
          followers: 20,
          following: 9,
          created_at: '2011-01-20T09:00:00Z',
        })
      );
      const firstResult = await fetchUserProfile('octocat');
      expect(firstResult.login).toBe('octocat');

      // 2. Mock a network failure for the second fetch
      vi.mocked(fetch).mockRejectedValue(new Error('TypeError: Failed to fetch'));

      // 3. Force refresh or bypass cache to trigger error path, should get stale data with isOfflineFallback
      const result = await fetchUserProfile('octocat', { forceRefresh: true });
      expect(result.login).toBe('octocat');
      expect(result.isOfflineFallback).toBe(true);
    });

    it('returns a mock placeholder profile if cache is empty on network failure', async () => {
      // Mock network failure immediately when cache is empty
      vi.mocked(fetch).mockRejectedValue(new Error('TypeError: Failed to fetch'));

      const result = await fetchUserProfile('some-new-user');
      expect(result.login).toBe('some-new-user');
      expect(result.isOfflineFallback).toBe(true);
      expect(result.bio).toContain('offline fallback');
    });
  });

  describe('fetchUserRepos Fallback', () => {
    it('falls back to stale cache data on network failure', async () => {
      // 1. Populate cache
      vi.mocked(fetch).mockResolvedValueOnce(
        mockResponse([{ name: 'repo-1', stargazers_count: 5, language: 'TypeScript' }])
      );
      const firstResult = await fetchUserRepos('octocat');
      expect(firstResult).toHaveLength(1);

      // 2. Mock network failure
      vi.mocked(fetch).mockRejectedValue(new Error('TypeError: Failed to fetch'));

      // 3. Trigger error path
      const result = await fetchUserRepos('octocat', { forceRefresh: true });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('repo-1');
    });

    it('returns empty array if cache is empty on network failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('TypeError: Failed to fetch'));

      const result = await fetchUserRepos('some-new-user');
      expect(result).toEqual([]);
    });
  });

  describe('fetchGitHubContributions Fallback', () => {
    it('falls back to stale cache data on network failure', async () => {
      // 1. Populate cache
      const mockCalendar = {
        totalContributions: 10,
        weeks: [],
      };
      vi.mocked(fetch).mockResolvedValueOnce(
        mockResponse({
          data: {
            user: {
              contributionsCollection: {
                contributionCalendar: mockCalendar,
                commitContributionsByRepository: [],
              },
            },
          },
        })
      );
      const firstResult = await fetchGitHubContributions('octocat');
      expect(firstResult.calendar.totalContributions).toBe(10);

      // 2. Mock network failure
      vi.mocked(fetch).mockRejectedValue(new Error('TypeError: Failed to fetch'));

      // 3. Trigger error path
      const result = await fetchGitHubContributions('octocat', { forceRefresh: true });
      expect(result.calendar.totalContributions).toBe(10);
      expect(result.isOfflineFallback).toBe(true);
    });

    it('returns empty mock contributions calendar if cache is empty on network failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('TypeError: Failed to fetch'));

      const result = await fetchGitHubContributions('some-new-user');
      expect(result.calendar.totalContributions).toBe(0);
      expect(result.isOfflineFallback).toBe(true);
    });
  });
});
