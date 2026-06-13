// lib/github.test.ts
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGitHubContributions,
  fetchUserProfile,
  fetchUserRepos,
  fetchContributedRepos,
  generateAchievements,
  buildCommitClock,
  fetchOrgMembers,
  getFullDashboardData,
  getOrgDashboardData,
  getWrappedData,
  computeDeveloperScore,
  buildProfileData,
  aggregateLanguages,
  buildInsights,
  buildActivityMap,
  runCappedConcurrency,
} from './github';

// Mock the internal network modules cleanly
vi.mock('./utils', () => ({
  contributionsCache: {
    get: async () => null,
    set: async () => ({}),
  },
}));

// Mock the global global.fetch pipeline
const fetchMock = vi.fn();
global.fetch = fetchMock;

function mockResponse(data: any, status = 200, headers: any = {}) {
  const headerMap = new Map(Object.entries(headers));
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => headerMap.get(key) || null,
    },
    json: () => Promise.resolve(data),
    clone: function () {
      return this;
    },
  } as any);
}

describe('GitHub Core Suite Mocks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('runCappedConcurrency', () => {
    it('should process items correctly', async () => {
      const results = await runCappedConcurrency([1, 2], 2, async (x: number) => x * 10);
      expect(results).toEqual([10, 20]);
    });
  });

  describe('fetchContributedRepos', () => {
    it('returns contributed repos on success', async () => {
      const mockNodes = [
        {
          name: 'repo1',
          nameWithOwner: 'owner/repo1',
          stargazerCount: 10,
          forkCount: 5,
          primaryLanguage: { name: 'TypeScript' },
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockImplementation(() =>
        mockResponse({ data: { user: { repositoriesContributedTo: { nodes: mockNodes } } } })
      );
      const result = await fetchContributedRepos('octocat', {} as any);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getWrappedData', () => {
    it('calculates weekend boundaries with standard weeks structures', async () => {
      const mockCalendar = {
        totalContributions: 8,
        weeks: [
          {
            contributionDays: [
              { contributionCount: 3, date: '2024-06-10' },
              { contributionCount: 5, date: '2024-06-12' },
            ],
          },
        ],
      };

      fetchMock.mockImplementation(() =>
        mockResponse({
          data: {
            user: {
              contributionsCollection: {
                contributionCalendar: mockCalendar,
              },
            },
          },
        })
      );

      const result = await getWrappedData('octocat', { from: '2024-01-01' } as any);
      expect(result.weekendRatio).toBe(100);
    });
  });

  describe('getFullDashboardData', () => {
    it('throws if the contributions fetch fails, instead of returning zeroed stats', async () => {
      // Simulate a hard rejected network channel
      fetchMock.mockImplementation(() => Promise.reject(new Error('GraphQL query rejected')));

      await expect(getFullDashboardData('octocat', { bypassCache: true } as any)).rejects.toThrow(
        '[GitHub API] Failed to fetch contributions for user "octocat"'
      );
    });
  });
});
