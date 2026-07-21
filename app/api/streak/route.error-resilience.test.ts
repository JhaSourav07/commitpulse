import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/github')>('../../../lib/github');
  return {
    ...actual,
    fetchGitHubContributions: vi.fn(),
    getOrgDashboardData: vi.fn(),
    getCircuitTelemetry: vi.fn().mockReturnValue({ isOpen: false, resetInMs: 0 }),
    fetchCommitHourDistribution: vi.fn(),
  };
});

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import {
  fetchGitHubContributions,
  getOrgDashboardData,
  fetchCommitHourDistribution,
} from '../../../lib/github';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';
import type { ContributionCalendar, ExtendedContributionData } from '../../../types';
import { refreshPolicy } from '../../../services/github/refresh-policy';
import { refreshRateLimiter } from '../../../services/github/refresh-rate-limiter';
import { quotaMonitor } from '../../../services/github/quota-monitor';
import { logger } from '../../../lib/logger';

const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-06-10' },
        { contributionCount: 2, date: '2024-06-11' },
        { contributionCount: 0, date: '2024-06-12' },
        { contributionCount: 3, date: '2024-06-13' },
        { contributionCount: 1, date: '2024-06-14' },
        { contributionCount: 0, date: '2024-06-15' },
        { contributionCount: 3, date: '2024-06-16' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/streak');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/streak — error resilience & exception safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    quotaMonitor.reset();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getOrgDashboardData).mockResolvedValue({
      profile: {
        username: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://github.com/octocat.png',
        isPro: false,
        bio: 'Testing organization mock pipelines',
        location: 'San Francisco, CA',
        joinedDate: '2011-01-25',
        developerScore: 85,
        stats: { repositories: 10, followers: 2500, following: 9, stars: 450 },
      },
      stats: {
        totalCommits: 10,
        totalIssues: 2,
        totalPRs: 5,
        totalReviews: 1,
        totalDiscussions: 0,
        contributedTo: 3,
      },
      calendar: mockCalendar,
    } as unknown as Awaited<ReturnType<typeof getOrgDashboardData>>);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('quota / refresh guard rails fail closed without crashing', () => {
    it('returns a 429 fallback instead of throwing when GitHub quota is low on a refresh request', async () => {
      vi.spyOn(quotaMonitor, 'isQuotaLow').mockReturnValue(true);

      const response = await GET(makeRequest({ user: 'octocat', refresh: 'true' }));

      expect(response.status).toBe(429);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('returns a 429 fallback instead of throwing when the refresh rate limiter rejects the request', async () => {
      vi.spyOn(refreshRateLimiter, 'checkLimit').mockReturnValue({
        success: false,
      } as ReturnType<typeof refreshRateLimiter.checkLimit>);

      const response = await GET(makeRequest({ user: 'octocat', refresh: 'true' }));

      expect(response.status).toBe(429);
      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('degrades gracefully to cached data (200 OK) instead of erroring when a refresh cooldown is active', async () => {
      vi.spyOn(refreshPolicy, 'isRefreshAllowed').mockReturnValue(false);

      const response = await GET(makeRequest({ user: 'octocat', refresh: 'true' }));

      expect(response.status).toBe(200);
      expect(fetchGitHubContributions).toHaveBeenCalledWith(
        'octocat',
        expect.objectContaining({ bypassCache: false })
      );
    });
  });

  describe('JSON output mode error fallbacks (format=json)', () => {
    it('returns a structured 500 JSON error, not a crash, for an unrecognised upstream failure', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('socket hang up'));

      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      const body = await response.json();
      expect(body).toEqual({ error: 'Something went wrong. Please try again later.' });
    });

    it('returns a structured 404 JSON error for an unknown user', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(
        new Error('GitHub user "ghost" not found')
      );

      const response = await GET(makeRequest({ user: 'ghost', format: 'json' }));

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Something went wrong. Please try again later.');
    });

    it('returns a structured 429 JSON error with Retry-After for a rate limit failure', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API Rate Limit Exceeded'));

      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
      const body = await response.json();
      expect(body.error).toBe('Something went wrong. Please try again later.');
    });

    it('returns a structured 400 JSON error with sanitized text for a validation failure', async () => {
      const err = new Error('ZodError: invalid shape at users[0]');
      err.name = 'ValidationError';
      vi.mocked(fetchGitHubContributions).mockRejectedValue(err);

      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid request parameters');
      expect(body.error).not.toContain('ZodError');
      expect(body.error).not.toContain('users[0]');
    });

    it('produces a clean JSON 500 fallback when a non-Error value (plain object) is thrown', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue({ code: 'ECONNRESET' });

      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: 'Something went wrong. Please try again later.' });
    });
  });

  describe('SVG output mode: internal error details are never leaked', () => {
    it('replaces a Zod/schema-flavoured validation message with a generic one in the fallback SVG', async () => {
      const err = new Error('schema mismatch: invalid field "lang" at path root.query.lang');
      err.name = 'ValidationError';
      vi.mocked(fetchGitHubContributions).mockRejectedValue(err);

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(400);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('Invalid request parameters');
      expect(body).not.toContain('schema mismatch');
      expect(body).not.toContain('root.query.lang');
    });

    it('does not crash when a not-found error message has no quoted username to extract', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(
        new Error('Could not resolve requested login')
      );

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(404);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('NOT FOUND');
      expect(body).toContain('OCTOCAT');
    });

    it('falls back to a 500 error SVG instead of crashing when the org dashboard throws an unexpected error', async () => {
      vi.mocked(getOrgDashboardData).mockRejectedValue(
        new Error('connection terminated unexpectedly')
      );

      const response = await GET(makeRequest({ user: 'octocat', org: 'vercel' }));

      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('Something went wrong. Please try again later.');
      expect(body).not.toContain('connection terminated unexpectedly');
    });
  });

  describe('timeout / abort handling (isAbortError)', () => {
    it('returns a 504 timeout SVG when the rejection has name "AbortError"', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue({ name: 'AbortError' });

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(504);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('Request timed out');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('returns a 504 timeout SVG when the rejection has name "TimeoutError"', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue({ name: 'TimeoutError' });

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(504);
    });

    it('returns a 504 timeout SVG when a plain Error message mentions "timed out" with no name field', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(
        new Error('Request timed out waiting for GitHub')
      );

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(504);
      const body = await response.text();
      expect(body).toContain('Request timed out');
    });

    it('returns a structured 504 JSON error when the rejection has name "AbortError"', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue({ name: 'AbortError' });

      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));

      expect(response.status).toBe(504);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      const body = await response.json();
      expect(body).toEqual({ error: 'Upstream request timed out after 10 seconds.' });
    });
  });

  describe('asymmetric multi-target resilience', () => {
    it('fails the whole request cleanly (not a partial/corrupt SVG) when the ?versus= comparison user fails to load', async () => {
      vi.mocked(fetchGitHubContributions)
        .mockResolvedValueOnce({
          calendar: mockCalendar,
          repoContributions: [],
        } as unknown as ExtendedContributionData)
        .mockRejectedValueOnce(new Error('unexpected upstream failure for versus target'));

      const response = await GET(makeRequest({ user: 'octocat', versus: 'monalisa' }));

      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('Something went wrong. Please try again later.');
      expect(body).not.toContain('unexpected upstream failure');
    });
  });

  describe('dev-telemetry logging on unhandled errors', () => {
    it('logs unexpected errors with a sanitized message and the "streak" source tag', async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
      vi.mocked(fetchGitHubContributions).mockRejectedValue(
        new Error('internal token rotation failed for cache node 7')
      );

      await GET(makeRequest({ user: 'octocat' }));

      expect(errorSpy).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          source: 'streak',
          message: 'Something went wrong. Please try again later.',
        })
      );
      const [, meta] = errorSpy.mock.calls[0] as [string, { message: string }];
      expect(meta.message).not.toContain('token rotation');
      expect(meta.message).not.toContain('cache node 7');
    });

    it('does not invoke dev-telemetry logging for expected, user-facing validation errors', async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

      await GET(makeRequest({ user: 'octocat', theme: 'nonexistent_theme_name' }));

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cache-Control on error paths not covered by route.test.ts', () => {
    it('returns a 400 with no-store caching for validation errors so a corrected reload is never served stale data', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'nonexistent_theme_name' }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('never lets a client cache a 404 not-found error response', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(
        new Error('GitHub user "ghost" not found')
      );

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(404);
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });
  });

  describe('internal fallback catches keep dependent views healthy', () => {
    it('still returns a valid 200 commit-clock SVG when the commit-hour distribution fetch fails internally', async () => {
      vi.mocked(fetchCommitHourDistribution).mockRejectedValue(
        new Error('hour distribution service down')
      );

      const response = await GET(makeRequest({ user: 'octocat', view: 'commit_clock' }));

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).not.toContain('hour distribution service down');
    });
  });
});
