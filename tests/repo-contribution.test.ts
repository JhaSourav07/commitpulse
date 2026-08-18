import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streakParamsSchema } from '@/lib/validations';
import { cacheKey, fetchGitHubContributions } from '@/lib/github';

describe('Repository-Specific Contribution Monolith', () => {
  describe('Streak Parameter Schema Validation for &repo', () => {
    it('accepts valid owner/repo format', () => {
      const result = streakParamsSchema.safeParse({ user: 'octocat', repo: 'facebook/react' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repo).toBe('facebook/react');
      }
    });

    it('accepts hyphens, dots, and underscores in owner/repo', () => {
      const result = streakParamsSchema.safeParse({
        user: 'octocat',
        repo: 'Aditya8369/commitpulse.app_v2-demo',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repo).toBe('Aditya8369/commitpulse.app_v2-demo');
      }
    });

    it('rejects invalid repo formats', () => {
      const invalidRepos = ['just-repo-name', 'owner/repo/extra', 'owner/', '/repo', 'owner@/repo'];
      for (const invalidRepo of invalidRepos) {
        const result = streakParamsSchema.safeParse({ user: 'octocat', repo: invalidRepo });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Cache Key Generation with Repo Parameter', () => {
    it('includes repo in contribution cache keys', () => {
      const keyWithoutRepo = cacheKey('contributions', 'octocat');
      const keyWithRepo = cacheKey(
        'contributions',
        'octocat',
        undefined,
        undefined,
        undefined,
        'facebook/react'
      );

      expect(keyWithRepo).toContain(':repo:facebook/react');
      expect(keyWithRepo).not.toBe(keyWithoutRepo);
    });
  });

  describe('fetchGitHubContributions with repo filtering', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('scopes contribution calendar and totals to specified repo', async () => {
      const mockGraphQLResponse = {
        data: {
          user: {
            contributionsCollection: {
              totalPullRequestContributions: 5,
              totalIssueContributions: 2,
              totalPullRequestReviewContributions: 1,
              contributionCalendar: {
                totalContributions: 100,
                weeks: [
                  {
                    contributionDays: [
                      { date: '2025-01-01', contributionCount: 10, color: '#000' },
                      { date: '2025-01-02', contributionCount: 5, color: '#000' },
                    ],
                  },
                ],
              },
              commitContributionsByRepository: [
                {
                  repository: {
                    name: 'react',
                    nameWithOwner: 'facebook/react',
                    primaryLanguage: { name: 'JavaScript' },
                  },
                  contributions: {
                    totalCount: 5,
                    nodes: [{ occurredAt: '2025-01-01T10:00:00Z', commitCount: 5 }],
                  },
                },
                {
                  repository: {
                    name: 'next.js',
                    nameWithOwner: 'vercel/next.js',
                    primaryLanguage: { name: 'TypeScript' },
                  },
                  contributions: {
                    totalCount: 95,
                    nodes: [
                      { occurredAt: '2025-01-01T12:00:00Z', commitCount: 5 },
                      { occurredAt: '2025-01-02T14:00:00Z', commitCount: 5 },
                    ],
                  },
                },
              ],
            },
          },
        },
      };

      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify(mockGraphQLResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await fetchGitHubContributions('octocat', {
        bypassCache: true,
        repo: 'facebook/react',
      });

      expect(result.calendar.totalContributions).toBe(5);
      expect(result.calendar.weeks[0].contributionDays[0].contributionCount).toBe(5);
      expect(result.calendar.weeks[0].contributionDays[1].contributionCount).toBe(0);
      expect(result.repoContributions.length).toBe(1);
      expect(result.repoContributions[0].repository.nameWithOwner).toBe('facebook/react');
    });

    it('returns 0 total contributions when user has no commits in specified repo', async () => {
      const mockGraphQLResponse = {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 50,
                weeks: [
                  {
                    contributionDays: [{ date: '2025-01-01', contributionCount: 5, color: '#000' }],
                  },
                ],
              },
              commitContributionsByRepository: [
                {
                  repository: {
                    name: 'next.js',
                    nameWithOwner: 'vercel/next.js',
                    primaryLanguage: { name: 'TypeScript' },
                  },
                  contributions: {
                    totalCount: 50,
                    nodes: [{ occurredAt: '2025-01-01T12:00:00Z', commitCount: 5 }],
                  },
                },
              ],
            },
          },
        },
      };

      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify(mockGraphQLResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await fetchGitHubContributions('octocat', {
        bypassCache: true,
        repo: 'facebook/react',
      });

      expect(result.calendar.totalContributions).toBe(0);
      expect(result.calendar.weeks[0].contributionDays[0].contributionCount).toBe(0);
      expect(result.repoContributions).toEqual([]);
    });
  });
});
