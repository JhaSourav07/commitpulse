import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// We only mock the two things that reach outside this process:
// the GitHub API call and the wall-clock time helper.
// calculateStreak and generateSVG run for real, giving us genuine end-to-end coverage.
vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions, getOrgDashboardData } from '../../../lib/github';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';
import type { ContributionCalendar, ExtendedContributionData } from '../../../types';

// Two weeks of realistic data. The last day has 0 contributions so the streak
// is in "grace period" territory — a good baseline that exercises most code paths.
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
    {
      contributionDays: [
        { contributionCount: 0, date: '2024-06-17' },
        { contributionCount: 0, date: '2024-06-18' },
        { contributionCount: 0, date: '2024-06-19' },
        { contributionCount: 0, date: '2024-06-20' },
        { contributionCount: 0, date: '2024-06-21' },
        { contributionCount: 0, date: '2024-06-22' },
        { contributionCount: 0, date: '2024-06-23' },
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

describe('GET /api/streak', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // reset call counts so per-test call assertions are isolated
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
    // Fixed values so Cache-Control assertions don't depend on the real clock.
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  it('falls back to the default isometric view when an invalid view is provided', async () => {
    const request = new Request('http://localhost:3000/api/streak?user=octocat&view=invalid');

    const response = await GET(request);

    expect(response.status).toBe(200);

    const body = await response.text();

    expect(body).toContain('@keyframes grow-up');
  });

  describe('parameter validation', () => {
    it('returns 400 when grace=-1 is provided', async () => {
      const response = await GET(
        makeRequest({
          user: 'octocat',
          grace: '-1',
        })
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details.fieldErrors.grace[0]).toBe('grace must be an integer between 0 and 7');
    });

    it('returns 400 Bad Request when ?layout= is set to an unsupported format', async () => {
      const response = await GET(
        makeRequest({
          user: 'octocat',
          layout: 'unsupported_layout',
        })
      );

      expect(response.status).toBe(400);
    });

    it('does not call the GitHub API when layout is invalid', async () => {
      await GET(
        makeRequest({
          user: 'octocat',
          layout: 'unsupported_layout',
        })
      );

      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('returns 400 with a structured error body for unsupported_layout', async () => {
      const response = await GET(
        makeRequest({
          user: 'octocat',
          layout: 'unsupported_layout',
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
      expect(body.details).not.toBeNull();
    });

    it('returns 400 when the user parameter is missing', async () => {
      const response = await GET(makeRequest());

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
      expect(body.details).not.toBeNull();
      expect(typeof body.details).toBe('object');
      expect(Array.isArray(body.details)).toBe(false);
    });
    it('returns 400 when org parameter contains spaces and invalid characters', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', org: 'invalid_org_name_with_spaces' })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details.fieldErrors.org[0]).toBe('Invalid organization name format');
      expect(getOrgDashboardData).not.toHaveBeenCalled();
    });

    it('does not hit the GitHub API at all when user is missing', async () => {
      await GET(makeRequest());

      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('returns 400 for malformed GitHub usernames', async () => {
      const invalidUsers = ['http://localhost', 'harendra-', 'a--b', 'a'.repeat(40)];

      for (const user of invalidUsers) {
        const response = await GET(makeRequest({ user }));

        expect(response.status).toBe(400);
      }

      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('returns 400 when user contains spaces', async () => {
      const response = await GET(makeRequest({ user: 'john doe' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.user[0]).toContain('Invalid GitHub username');
    });

    it('returns 400 when user exceeds 39 characters', async () => {
      const response = await GET(makeRequest({ user: 'a'.repeat(40) }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(JSON.stringify(body)).toContain('cannot exceed 39 characters');
    });

    it('returns 400 for invalid monthly badge dimensions', async () => {
      const invalidDimensionParams: Array<Record<string, string>> = [
        { width: 'abc' },
        { width: '-50' },
        { width: '1201' },
        { height: 'abc' },
        { height: '0' },
        { height: '801' },
      ];

      for (const params of invalidDimensionParams) {
        const response = await GET(makeRequest({ user: 'octocat', view: 'monthly', ...params }));

        expect(response.status).toBe(400);
      }

      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('returns 400 for unsupported ?layout query parameter values (strict schema validation)', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/streak?user=octocat&layout=unsupported_layout')
      );

      expect(response.status).toBe(400);
    });

    it('should return 200 OK and valid SVG when the optional repo query parameter is provided', async () => {
      // 1. Make request with both parameters present
      const response = await GET(makeRequest({ user: 'octocat', repo: 'commitpulse' }));

      // 2. Assert definitions of done
      expect(response.status).toBe(200);

      const textOutput = await response.text();
      expect(textOutput).toContain('<svg');
    });

    it('should return 200 OK and valid SVG when the optional org query parameter is provided', async () => {
      // 1. Make request with both parameters present
      const response = await GET(makeRequest({ user: 'octocat', org: 'vercel' }));

      // 2. Assert definitions of done
      expect(response.status).toBe(200);

      const textOutput = await response.text();
      expect(textOutput).toContain('<svg');
    });

    it('returns 400 when org contains invalid characters', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', org: 'invalid_org_name_with_spaces' })
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.org[0]).toBe('Invalid organization name format');
      expect(getOrgDashboardData).not.toHaveBeenCalled();
    });
  });

  describe('successful response', () => {
    it('returns 200 with SVG content type', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('returns a well-formed SVG body', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(body).toContain('<svg');
      expect(body).toContain('viewBox');
      expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(body).toContain('</svg>');
    });

    it('returns valid SVG when mode=loc is given', async () => {
      const response = await GET(
        makeRequest({
          user: 'octocat',
          mode: 'loc',
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');

      const body = await response.text();

      expect(body).toContain('<svg');
    });

    it('forwards the username to fetchGitHubContributions', async () => {
      await GET(makeRequest({ user: 'octocat' }));

      expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', { bypassCache: false });
    });

    it('forwards grace parameter to fetchGitHubContributions', async () => {
      await GET(
        makeRequest({
          user: 'octocat',
          grace: '2',
        })
      );

      expect(fetchGitHubContributions).toHaveBeenCalled();
    });

    it('returns 400 when grace exceeds max value', async () => {
      const response = await GET(
        makeRequest({
          user: 'octocat',
          grace: '999',
        })
      );

      expect(response.status).toBe(400);
    });

    it('embeds the username (uppercased) in the SVG title', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      // The generator puts params.user.toUpperCase() in the SVG as the badge title.
      expect(body).toContain('OCTOCAT');
    });

    it('should contain a <title> element with accessible label in the SVG response', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(body).toContain('<title>');
      expect(body).toContain('Stats for');
    });
  });

  describe('edge cases for empty/private profiles', () => {
    it('Scenario 1: Normal active GitHub user', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('<svg');
    });

    it('Scenario 2 & 3: User with 0 public repositories or private profile (empty calendar)', async () => {
      vi.mocked(fetchGitHubContributions).mockResolvedValue({
        calendar: {
          totalContributions: 0,
          weeks: [],
        },
        repoContributions: [],
      } as unknown as ExtendedContributionData);

      const response = await GET(makeRequest({ user: 'private-user' }));
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('<svg');
      // Should show 0 contributions and streaks
      expect(body).toContain('>0<');
    });

    it('Scenario 4: Nonexistent username', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(
        new Error('GitHub user "nonexistent" not found')
      );

      const response = await GET(makeRequest({ user: 'nonexistent' }));
      expect(response.status).toBe(404);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('NOT FOUND');
    });

    it('Scenario 5: GitHub API failure', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API Rate Limit Exceeded'));

      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.status).toBe(429);
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('API RATE LIMIT');
    });
  });

  describe('cache-control header', () => {
    it('caches until UTC midnight by default, using the value from getSecondsUntilUTCMidnight', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );
    });

    it('reflects a different time value when the clock changes', async () => {
      // Make sure the header is actually wired to the time helper, not hardcoded.
      vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(7200);

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=7200, stale-while-revalidate=86400'
      );
    });

    it('bypasses the cache entirely when ?refresh=true', async () => {
      const response = await GET(makeRequest({ user: 'octocat', refresh: 'true' }));

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('passes bypassCache=true when refresh=true', async () => {
      await GET(makeRequest({ user: 'octocat', refresh: 'true' }));

      expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', { bypassCache: true });
    });

    it('keeps normal caching when refresh is "false"', async () => {
      // Only the exact string "true" disables caching.
      const response = await GET(makeRequest({ user: 'octocat', refresh: 'false' }));

      expect(response.headers.get('Cache-Control')).toContain('public');
    });

    it('keeps normal caching when refresh is "1" (not the exact string "true")', async () => {
      const response = await GET(makeRequest({ user: 'octocat', refresh: '1' }));

      expect(response.headers.get('Cache-Control')).toContain('public');
    });
  });

  describe('security headers', () => {
    it('sets a strict Content-Security-Policy with safe SVG styling rules', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("style-src 'unsafe-inline'");
      expect(csp).toContain('https://fonts.googleapis.com');
      expect(csp).not.toContain('script-src');
    });
  });

  describe('speed parameter', () => {
    it('accepts a valid integer speed like "3s" and passes it to the SVG', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '3s' }));
      const body = await response.text();

      expect(body).toContain('3s');
    });

    it('falls back to 8s for decimal values below minimum bound', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '1.5s' }));
      const body = await response.text();

      expect(body).toContain('8s');
    });

    it('falls back to 8s when the speed format is invalid (no unit)', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: 'fast' }));
      const body = await response.text();

      expect(body).toContain('8s');
      expect(body).not.toContain('fast');
    });

    it('falls back to 8s when speed is a bare number without the "s" suffix', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '5' }));
      const body = await response.text();

      expect(body).toContain('8s');
    });

    it('falls back to 8s when speed=10 is provided without unit', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '10' }));
      const body = await response.text();

      expect(body).toContain('8s');
    });

    it('falls back to 8s when speed is below minimum bound', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '1s' }));
      const body = await response.text();

      expect(body).toContain('8s');
    });

    it('falls back to 8s when speed exceeds maximum bound', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '999s' }));
      const body = await response.text();

      expect(body).toContain('8s');
    });

    it('accepts the minimum boundary speed "2s"', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '2s' }));
      const body = await response.text();

      expect(body).toContain('2s');
    });

    it('accepts the maximum boundary speed "20s"', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '20s' }));
      const body = await response.text();

      expect(body).toContain('20s');
    });

    it('falls back to 8s when speed is a non-integer decimal like "2.0s"', async () => {
      const response = await GET(makeRequest({ user: 'octocat', speed: '2.0s' }));
      const body = await response.text();

      expect(body).toContain('8s');
      expect(body).not.toContain('2.0s');
    });
  });

  describe('scale parameter', () => {
    it('returns 200 when scale=log is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', scale: 'log' }));

      expect(response.status).toBe(200);
    });

    it('defaults to linear scale when an unknown scale value is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', scale: 'exponential' }));

      expect(response.status).toBe(200);
    });

    it('defaults to linear scale when scale=foo is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', scale: 'foo' }));

      expect(response.status).toBe(200);
    });
  });

  describe('year parameter', () => {
    it('accepts a valid 4-digit year', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '2024' }));

      expect(response.status).toBe(200);
    });

    it('passes correct from/to range when ?year=2023 is provided', async () => {
      await GET(makeRequest({ user: 'octocat', year: '2023' }));

      expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
        bypassCache: false,
        from: '2023-01-01T00:00:00Z',
        to: '2023-12-31T23:59:59Z',
      });
    });

    it('passes correct from/to range when ?year=2008 is provided', async () => {
      await GET(makeRequest({ user: 'octocat', year: '2008' }));

      expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
        bypassCache: false,
        from: '2008-01-01T00:00:00Z',
        to: '2008-12-31T23:59:59Z',
      });
    });

    it('returns 400 when custom from date is after custom to date', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', from: '2025-12-31', to: '2025-01-01' })
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.to[0]).toContain(
        '"to" date must be after or equal to "from" date'
      );
      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('functions normally when the year parameter is missing', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(200);
    });

    it('returns 400 for invalid year format', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: 'abcd' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.year[0]).toContain('GitHub was founded in 2008');
    });

    // it('returns 200 for unknown ?date= parameter (not part of schema)', async () => {
    //   const response = await GET(makeRequest({ user: 'octocat', date: '2026-15-40' }));
    //   expect(response.status).toBe(200);
    // });

    it('returns 400 for malformed numeric year', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '100000' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.year[0]).toContain('GitHub was founded in 2008');
    });

    it('returns 400 for years before GitHub existed', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '1999' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.year[0]).toContain('GitHub was founded in 2008');
    });

    it('returns 400 for the year=2007(before GitHub was founded)', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '2007' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.year[0]).toContain('GitHub was founded in 2008');
    });

    it('returns 400 for future years', async () => {
      const futureYear = (new Date().getFullYear() + 1).toString();

      const response = await GET(makeRequest({ user: 'octocat', year: futureYear }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.year[0]).toContain('GitHub was founded in 2008');
    });

    it('accepts year=2008 (the earliest valid year)', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '2008' }));

      expect(response.status).toBe(200);
    });

    it('accepts the current year', async () => {
      const currentYear = new Date().getFullYear().toString();
      const response = await GET(makeRequest({ user: 'octocat', year: currentYear }));

      expect(response.status).toBe(200);
    });

    describe('date parameter', () => {
      it('returns 400 when an invalid ISO8601 calendar date format like "2026-15-40" is supplied', async () => {
        const response = await GET(makeRequest({ user: 'octocat', date: '2026-15-40' }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.details.fieldErrors.date[0]).toContain('Invalid "date" format');
      });
    });
  });

  describe('radius parameter', () => {
    it('applies radius=16 to the SVG background rect', async () => {
      const response = await GET(makeRequest({ user: 'octocat', radius: '16' }));
      const body = await response.text();

      expect(body).toContain('rx="16"');
    });

    it('applies radius=0 to the SVG background rect', async () => {
      const response = await GET(makeRequest({ user: 'octocat', radius: '0' }));
      const body = await response.text();

      expect(body).toContain('rx="0"');
    });

    it('clamps radius values above the maximum limit', async () => {
      const response = await GET(makeRequest({ user: 'octocat', radius: '200' }));
      const body = await response.text();

      expect(body).toContain('rx="50"');
    });

    it('clamps negative radius to 0', async () => {
      const response = await GET(makeRequest({ user: 'octocat', radius: '-5' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('rx="0"');
    });

    it('handles non-numeric radius gracefully', async () => {
      const response = await GET(makeRequest({ user: 'octocat', radius: 'abc' }));

      expect(response.status).toBe(200);
    });
  });

  describe('theme parameter', () => {
    it('returns 200 for a valid known theme like "neon"', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'neon' }));

      expect(response.status).toBe(200);
    });

    it('returns SVG content type for theme=neon', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'neon' }));

      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('returns SVG content type for theme=dracula', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'dracula' }));

      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('returns SVG content type for theme=auto', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'auto' }));

      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('returns auto-theme SVG markup with dark-mode CSS variables when theme=auto', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'auto' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('prefers-color-scheme: dark');
      expect(body).toContain('--cp-bg');
    });

    it('returns 400 Bad Request listing allowed themes when an invalid theme is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'nonexistent_theme_name' }));
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
      const fieldError = body.details.fieldErrors.theme[0];
      expect(fieldError).toContain('Invalid theme. Supported themes:');
      expect(fieldError).toContain('dark');
      expect(fieldError).toContain('light');
      expect(fieldError).toContain('neon');
    });
  });

  describe('custom colour overrides', () => {
    it('embeds a custom background colour in the SVG when bg is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat', bg: 'ff0000' }));
      const body = await response.text();

      expect(body).toContain('#ff0000');
    });

    it('embeds a custom accent colour in the SVG when accent is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat', accent: '00ff00' }));
      const body = await response.text();

      expect(body).toContain('#00ff00');
    });

    it('embeds a custom text color in the SVG when text is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat', text: 'ff0000' }));
      const body = await response.text();

      expect(body).toContain('#ff0000');
    });

    it('does not crash when an invalid text color is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat', text: 'notacolor' }));

      expect(response.status).toBe(400);
    });

    it('returns 400 when an invalid hex color is passed as accent', async () => {
      const response = await GET(makeRequest({ user: 'octocat', accent: '#ZZZZZZZ' }));

      expect(response.status).toBe(400);
    });
  });

  describe('hide parameters', () => {
    it('removes the username title when hide_title=true', async () => {
      const response = await GET(makeRequest({ user: 'octocat', hide_title: 'true' }));
      const body = await response.text();

      expect(body).not.toContain('OCTOCAT');
    });

    it('keeps the username title when hide_title=false', async () => {
      const response = await GET(makeRequest({ user: 'octocat', hide_title: 'false' }));
      const body = await response.text();

      expect(body).toContain('OCTOCAT');
    });

    it('removes the stats section when hide_stats=true', async () => {
      const response = await GET(makeRequest({ user: 'octocat', hide_stats: 'true' }));
      const body = await response.text();

      expect(body).not.toContain('CURRENT_STREAK');
    });

    it('keeps the stats section when hide_stats=false', async () => {
      const response = await GET(makeRequest({ user: 'octocat', hide_stats: 'false' }));
      const body = await response.text();

      expect(body).toContain('CURRENT_STREAK');
    });
  });

  describe('error handling', () => {
    it('returns 500 with SVG content type when fetchGitHubContributions throws', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API is down'));

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('embeds the thrown error message in the error SVG', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API is down'));

      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(body).toContain('Something went wrong. Please try again later.');
      expect(body).not.toContain('API is down');
    });

    it('never caches an error response', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('Network failure'));

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('sets the SVG Content-Security-Policy header on generic error responses', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('Network failure'));

      const response = await GET(makeRequest({ user: 'octocat' }));
      const csp = response.headers.get('Content-Security-Policy');

      expect(response.status).toBe(500);
      expect(csp).toContain("default-src 'none'");
      expect(csp).not.toContain('script-src');
    });

    it('returns 429 with no-cache headers and rate limit SVG when rate limited', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API Rate Limit Exceeded'));

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(429);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      const body = await response.text();
      expect(body).toContain('API RATE LIMIT');
    });

    it('returns a valid 500 SVG even when something non-Error is thrown', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue('something went very wrong');

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).toContain('Something went wrong. Please try again later.');
      expect(body).not.toContain('Unknown error');
    });

    it('returns a well-formed SVG structure even in the error state', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('crash'));

      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(body).toContain('<svg');
      expect(body).toContain('</svg>');
    });
  });

  describe('timezone parameter (?tz=)', () => {
    it('returns 400 when an unrecognised IANA timezone is supplied', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Not/ATimezone' }));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details.fieldErrors.tz[0]).toContain('Invalid timezone');
    });

    it('returns 400 and names the bad value in the field error', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'garbage' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.tz[0]).toContain('Invalid timezone');
    });

    it('is not vulnerable to XSS via tz parameter', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', tz: '</text><script>alert(1)</script>' })
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.tz[0]).toContain('Invalid timezone');
    });

    it('returns 200 with a valid IANA timezone', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'America/New_York' }));

      expect(response.status).toBe(200);
    });

    it('uses getSecondsUntilMidnightInTimezone (not UTC) for the cache TTL when ?tz= is set', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'America/New_York' }));

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=7200, stale-while-revalidate=86400'
      );
      expect(getSecondsUntilMidnightInTimezone).toHaveBeenCalledWith('America/New_York');
      expect(getSecondsUntilUTCMidnight).not.toHaveBeenCalled();
    });

    it('still uses getSecondsUntilUTCMidnight when no ?tz= param is given', async () => {
      await GET(makeRequest({ user: 'octocat' }));

      expect(getSecondsUntilUTCMidnight).toHaveBeenCalled();
      expect(getSecondsUntilMidnightInTimezone).not.toHaveBeenCalled();
    });

    it('returns 200 with valid SVG and calls getSecondsUntilMidnightInTimezone for Australia/Sydney', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Australia/Sydney' }));

      expect(response.status).toBe(200);

      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('</svg>');

      expect(getSecondsUntilMidnightInTimezone).toHaveBeenCalledWith('Australia/Sydney');
    });

    it('returns 400 when a fictitious planetary timezone Mars/Cyonia is supplied', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Mars/Cyonia' }));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details.fieldErrors.tz[0]).toContain('Invalid timezone');
    });
  });

  describe('hide_background parameter', () => {
    it('produces a transparent background when ?hide_background=true is set', async () => {
      const response = await GET(makeRequest({ user: 'octocat', hide_background: 'true' }));
      const body = await response.text();

      expect(body).toContain('fill="transparent"');
    });

    it('does not produce a transparent background when ?hide_background is omitted', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(body).not.toContain('fill="transparent"');
    });
  });

  describe('monthly view parameter', () => {
    it('returns 200 when view=monthly is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', view: 'monthly' }));

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('COMMITS THIS MONTH');
    });

    it('uses the selected year when generating archived monthly stats', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));

      vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
        calendar: {
          totalContributions: 25,
          weeks: [
            { contributionDays: [{ date: '2024-11-15', contributionCount: 10 }] },
            { contributionDays: [{ date: '2024-12-15', contributionCount: 15 }] },
          ],
        } as ContributionCalendar,
        repoContributions: [],
      } as unknown as ExtendedContributionData);

      try {
        const response = await GET(
          makeRequest({ user: 'octocat', view: 'monthly', year: '2024', delta_format: 'both' })
        );

        expect(response.status).toBe(200);
        expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
          bypassCache: false,
          from: '2024-01-01T00:00:00Z',
          to: '2024-12-31T23:59:59Z',
        });

        const body = await response.text();
        expect(body).toContain('DECEMBER');
        expect(body).toContain('class="stats">15</text>');
        expect(body).toContain('+50% (+5)');
        expect(body).not.toContain('MAY');
      } finally {
        vi.useRealTimers();
      }
    });

    it('uses valid custom width and height in monthly SVG output', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', view: 'monthly', width: '400', height: '200' })
      );
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('width="400"');
      expect(body).toContain('height="200"');
      expect(body).toContain('viewBox="0 0 400 200"');
    });

    it('defaults to default view when an unknown view is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', view: 'invalid' }));

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('CURRENT_STREAK');
    });

    it('returns streak view when view=streak is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', view: 'streak' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('CURRENT_STREAK');
    });

    it('applies custom width and height parameters to the monthly SVG', async () => {
      const tempMockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              createdAt: '2020-01-01T00:00:00Z',
              contributionsCollection: {
                contributionCalendar: {
                  totalContributions: 100,
                  weeks: [],
                },
              },
            },
          },
        }),
      });
      vi.stubGlobal('fetch', tempMockFetch);

      const req = makeRequest({ user: 'octocat', view: 'monthly', width: '400', height: '150' });
      const res = await GET(req);

      expect(res.status).toBe(200);

      const body = await res.text();

      expect(body).toContain('width="400"');
      expect(body).toContain('height="150"');

      vi.unstubAllGlobals();
    });

    it('applies delta_format=both to show percent and absolute values in the monthly SVG', async () => {
      vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
        calendar: {
          totalContributions: 150,
          weeks: [
            { contributionDays: [{ date: '2026-04-15', contributionCount: 10 }] },
            { contributionDays: [{ date: '2026-05-15', contributionCount: 15 }] },
          ],
        } as ContributionCalendar,
        repoContributions: [],
      } as unknown as ExtendedContributionData);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));

      const req = makeRequest({ user: 'octocat', view: 'monthly', delta_format: 'both' });
      const res = await GET(req);

      expect(res.status).toBe(200);

      const body = await res.text();

      expect(body).toContain('%');

      vi.useRealTimers();
    });

    it('applies delta_format=absolute to show raw commit counts in the monthly SVG', async () => {
      vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
        calendar: {
          totalContributions: 150,
          weeks: [
            { contributionDays: [{ date: '2026-04-15', contributionCount: 10 }] },
            { contributionDays: [{ date: '2026-05-15', contributionCount: 15 }] },
          ],
        } as ContributionCalendar,
        repoContributions: [],
      } as unknown as ExtendedContributionData);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));

      const req = makeRequest({ user: 'octocat', view: 'monthly', delta_format: 'absolute' });
      const res = await GET(req);

      expect(res.status).toBe(200);

      const body = await res.text();

      expect(body).toContain('commits');

      vi.useRealTimers();
    });
  });

  describe('theme=random cache header', () => {
    it('returns no-cache header when ?theme=random is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'random' }));

      expect(response.headers.get('Cache-Control')).toMatch(/public, s-maxage=/);
    });
  });

  describe('Ghost City Mode (route integration)', () => {
    it('returns ghost city SVG when user has 0 total contributions', async () => {
      const emptyCalendar: ContributionCalendar = {
        totalContributions: 0,
        weeks: [
          {
            contributionDays: [{ contributionCount: 0, date: '2024-06-10' }],
          },
        ],
      };

      vi.mocked(fetchGitHubContributions).mockResolvedValue({
        calendar: emptyCalendar,
        repoContributions: [],
      } as unknown as ExtendedContributionData);
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(body).toContain('stroke-width="0.5"');
      expect(body).toContain('stroke-opacity="0.3"');
    });
  });

  describe('lang parameter', () => {
    it('returns Spanish translations when ?lang=es is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', lang: 'es' }));
      const body = await response.text();
      expect(body).toContain('RACHA_ACTUAL');
      expect(body).toContain('TOTAL_ANUAL');
      expect(body).toContain('RACHA_MÁXIMA');
    });

    it('returns Hindi translations when ?lang=hi is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', lang: 'hi' }));
      const body = await response.text();
      expect(body).toContain('वर्तमान_स्ट्रीक');
      expect(body).toContain('वार्षिक_कुल');
      expect(body).toContain('अधिकतम_स्ट्रीक');
    });

    it('returns French translations when ?lang=fr is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', lang: 'fr' }));
      const body = await response.text();
      expect(body).toContain('SÉRIE_ACTUELLE');
      expect(body).toContain('TOTAL_ANNUEL');
      expect(body).toContain('SÉRIE_MAXIMALE');
    });

    it('falls back to English when an unknown ?lang=xx is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', lang: 'xx' }));
      const body = await response.text();
      expect(body).toContain('CURRENT_STREAK');
      expect(body).toContain('ANNUAL_SYNC_TOTAL');
      expect(body).toContain('PEAK_STREAK');
    });
  });

  describe('font parameter sanitization', () => {
    it('uses the default font when font param is omitted', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Space Grotesk');
    });

    it('uses the default font when font param is an empty string', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: '' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Space Grotesk');
    });

    it('uses the default font when font param is whitespace only', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: '   ' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Space Grotesk');
      expect(body).not.toContain('family=+&display=swap');
    });

    it('passes a valid predefined font name through to the SVG', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'jetbrains' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('JetBrains Mono');
    });

    it('passes a valid custom font name through and emits a Google Fonts import', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'Inter' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('family=Inter');
      expect(body).toContain('"Inter", sans-serif');
    });

    it('encodes spaces in multi-word font names as "+" in the Google Fonts URL', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'Open Sans' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('family=Open+Sans');
    });

    it('falls back to the default font when font contains only special characters', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: '!!!' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Space Grotesk');
      expect(body).not.toContain('family=&display=swap');
    });

    it('strips dangerous characters from a font name containing a double-quote', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'Inter"' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Inter');
      expect(body).not.toContain("font: 'Inter\"'");
      expect(body).not.toContain('font-family: Inter"');
    });

    it('rejects a font name containing a semicolon (CSS injection attempt)', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'Inter; @import evil' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).not.toContain('@import evil');
      expect(body).not.toContain('family=Inter%3B');
    });

    it('strips special characters from a URL-like font name (path traversal / injection attempt)', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'https://evil.com' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).not.toContain('https://evil.com');
      expect(body).not.toContain('evil.com');
    });

    it('rejects a font name containing a script tag (XSS attempt)', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', font: '<script>alert(1)</script>' })
      );
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).not.toContain('<script>');
      expect(body).not.toContain('alert(1)');
    });

    it('does not emit a Google Fonts import when a predefined font is used', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'fira' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Fira Code');
      expect(body).not.toContain('family=fira&display=swap');
    });

    it('returns 200 and a valid SVG even when an extreme font value is supplied', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'a'.repeat(200) }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('<svg');
      expect(body).toContain('</svg>');
    });

    it('passes custom font name and emits Google Fonts import under theme=auto', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'auto', font: 'Inter' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('family=Inter&amp;display=swap');
      expect(body).toContain('"Inter", sans-serif');
    });
  });

  describe('stale-while-revalidate cache header', () => {
    it('contains stale-while-revalidate=86400 for normal request', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate=86400');
    });

    it('does NOT contain stale-while-revalidate when ?refresh=true', async () => {
      const response = await GET(makeRequest({ user: 'octocat', refresh: 'true' }));

      expect(response.headers.get('Cache-Control')).not.toContain('stale-while-revalidate=86400');
    });
  });

  describe('org parameter validation', () => {
    it('returns 400 when org parameter is a User instead of an Organization', async () => {
      vi.mocked(getOrgDashboardData).mockRejectedValueOnce(
        new Error('This endpoint is strictly for organizations.')
      );

      const response = await GET(makeRequest({ user: 'octocat', org: 'notanorg' }));
      expect(response.status).toBe(400);

      const body = await response.text();
      expect(body).toContain('strictly for organizations');
    });
  });

  describe('JSON output mode (format=json)', () => {
    it('returns JSON with correct Content-Type when format=json is set', async () => {
      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('returns stats, monthlyStats, and calendar in JSON response', async () => {
      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));
      const data = await response.json();

      expect(data.user).toBe('octocat');
      expect(data.stats).toBeDefined();
      expect(data.stats.currentStreak).toBeDefined();
      expect(data.stats.longestStreak).toBeDefined();
      expect(data.stats.totalContributions).toBeDefined();
      expect(data.monthlyStats).toBeDefined();
      expect(data.monthlyStats.currentMonthTotal).toBeDefined();
      expect(data.calendar).toBeDefined();
      expect(data.calendar.totalContributions).toBe(10);
      expect(data.calendar.weeks).toHaveLength(2);
    });

    it('includes Cache-Control header in JSON response', async () => {
      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));
      expect(response.headers.get('Cache-Control')).toContain('s-maxage=');
    });

    it('includes X-Cache-Status header in JSON response', async () => {
      const response = await GET(makeRequest({ user: 'octocat', format: 'json' }));
      expect(response.headers.get('X-Cache-Status')).toBe('HIT');
    });

    it('returns SVG when format is not set (default)', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('falls back to SVG for invalid format values', async () => {
      const response = await GET(makeRequest({ user: 'octocat', format: 'xml' }));
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('uses org name as user field when org parameter is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat', org: 'github', format: 'json' }));
      const data = await response.json();
      expect(data.user).toBe('github');
    });
  });
});
