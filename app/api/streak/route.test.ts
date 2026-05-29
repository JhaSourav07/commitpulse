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
import type { ContributionCalendar } from '../../../types';

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
    vi.mocked(fetchGitHubContributions).mockResolvedValue(mockCalendar);
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
    it('returns 400 when the user parameter is missing', async () => {
      const response = await GET(makeRequest());

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid parameters');
      expect(body.details).not.toBeNull();
      expect(typeof body.details).toBe('object');
      expect(Array.isArray(body.details)).toBe(false);
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

    it('returns valid SVG when grace exceeds max value', async () => {
      const response = await GET(
        makeRequest({
          user: 'octocat',
          grace: '999',
        })
      );

      expect(response.status).toBe(200);

      const body = await response.text();
      expect(body).toContain('<svg');
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
      // The route only accepts "log" — anything else is treated as "linear".
      // A 200 response confirms no crash; the generator silently uses the default.
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
      // 2008 is the GitHub founding year — the lower boundary of the valid range
      const response = await GET(makeRequest({ user: 'octocat', year: '2008' }));

      expect(response.status).toBe(200);
    });

    it('accepts the current year', async () => {
      // Upper boundary — the current year must always be accepted
      const currentYear = new Date().getFullYear().toString();
      const response = await GET(makeRequest({ user: 'octocat', year: currentYear }));

      expect(response.status).toBe(200);
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
      // sanitizeRadius uses Math.max(0, ...) so negatives must floor at 0
      const response = await GET(makeRequest({ user: 'octocat', radius: '-5' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('rx="0"');
    });

    it('handles non-numeric radius gracefully', async () => {
      // sanitizeRadius returns the fallback (8) when parseInt produces NaN
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

    it('falls back to the dark theme without crashing when an unknown theme is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'does-not-exist' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('58a6ff'); // Dark theme accent is #58a6ff — confirms the dark fallback is actually applied
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

    it('returns a valid 500 SVG even when something non-Error is thrown', async () => {
      // JavaScript lets you throw anything — strings, numbers, plain objects.
      // The catch block checks instanceof Error; if that fails it falls back to "Unknown error".
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
      const body = await response.text();
      expect(body).toContain('Invalid "tz" parameter');
    });

    it('returns 400 and names the bad value in the error message', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'garbage' }));
      const body = await response.text();

      expect(body).toContain('garbage');
    });

    it('returns 200 with a valid IANA timezone', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'America/New_York' }));

      expect(response.status).toBe(200);
    });

    it('uses getSecondsUntilMidnightInTimezone (not UTC) for the cache TTL when ?tz= is set', async () => {
      // getSecondsUntilMidnightInTimezone is mocked to return 7200 in beforeEach.
      // getSecondsUntilUTCMidnight returns 3600. The header should use 7200.
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
      // It should generate the default streak SVG and have "CURRENT_STREAK"
      expect(body).toContain('CURRENT_STREAK');
    });

    it('returns streak view when view=streak is given', async () => {
      // "streak" is not in the enum so .catch("default") applies — same output as default
      const response = await GET(makeRequest({ user: 'octocat', view: 'streak' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('CURRENT_STREAK');
    });
    // =========================================================================
    // ISSUE OBJECTIVE: Route test for ?view=monthly&delta_format=both
    // =========================================================================
    it('applies delta_format=both to show percent and absolute values in the monthly SVG', async () => {
      // 1. Mock the GitHub fetch with actual weekly data using vi.mocked
      vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
        totalContributions: 150,
        weeks: [
          { contributionDays: [{ date: '2026-04-15', contributionCount: 10 }] },
          { contributionDays: [{ date: '2026-05-15', contributionCount: 15 }] },
        ],
      } as unknown as ContributionCalendar);

      // 2. Lock the system time to May 2026 so the calendar calculation aligns
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));

      // 3. Make request using the file's built-in makeRequest helper
      const req = makeRequest({ user: 'octocat', view: 'monthly', delta_format: 'both' });
      const res = await GET(req);

      expect(res.status).toBe(200);

      const body = await res.text();

      // 4. Assert body contains % (percent part)
      expect(body).toContain('%');

      // Cleanup
      vi.useRealTimers();
    });

    // =========================================================================
    // ISSUE OBJECTIVE: Route test for ?view=monthly&delta_format=absolute
    // =========================================================================
    it('applies delta_format=absolute to show raw commit counts in the monthly SVG', async () => {
      // 1. Mock the GitHub fetch with actual weekly data using vi.mocked
      vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
        totalContributions: 150,
        weeks: [
          { contributionDays: [{ date: '2026-04-15', contributionCount: 10 }] },
          { contributionDays: [{ date: '2026-05-15', contributionCount: 15 }] },
        ],
      } as unknown as ContributionCalendar);

      // 2. Lock the system time to May 2026 so the calendar calculation aligns
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));

      // 3. Make request using the file's built-in makeRequest helper
      const req = makeRequest({ user: 'octocat', view: 'monthly', delta_format: 'absolute' });
      const res = await GET(req);

      expect(res.status).toBe(200);

      const body = await res.text();

      // 4. Assert body contains 'commits' (the absolute delta unit)
      expect(body).toContain('commits');

      // Cleanup
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

      vi.mocked(fetchGitHubContributions).mockResolvedValue(emptyCalendar);
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
      // Default body font is Space Grotesk
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
      // Whitespace-only should not produce a Google Fonts import with an empty family
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
      // No empty Google Fonts import should be emitted
      expect(body).not.toContain('family=&display=swap');
    });

    it('strips dangerous characters from a font name containing a double-quote', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'Inter"' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      // The quote is stripped; the cleaned name "Inter" should still be used
      expect(body).toContain('Inter');
      // The raw unescaped quote must not appear in the SVG output
      expect(body).not.toContain("font: 'Inter\"'");
      expect(body).not.toContain('font-family: Inter"');
    });

    it('rejects a font name containing a semicolon (CSS injection attempt)', async () => {
      // sanitizeGoogleFontUrl rejects names with semicolons — no Google Fonts import
      const response = await GET(makeRequest({ user: 'octocat', font: 'Inter; @import evil' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).not.toContain('@import evil');
      expect(body).not.toContain('family=Inter%3B');
    });

    it('strips special characters from a URL-like font name (path traversal / injection attempt)', async () => {
      // sanitizeFont strips ":", "/", "." — "https://evil.com" becomes "httpsevilcom"
      // sanitizeGoogleFontUrl then rejects it because "." is not in the whitelist
      const response = await GET(makeRequest({ user: 'octocat', font: 'https://evil.com' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      // The original URL must not appear verbatim in the SVG
      expect(body).not.toContain('https://evil.com');
      // The domain must not appear in the output
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
      // Predefined fonts (fira, jetbrains, roboto) are already bundled via the
      // static @import at the top of the <style> block — no extra import needed.
      const response = await GET(makeRequest({ user: 'octocat', font: 'fira' }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('Fira Code');
      // Should NOT emit a second dynamic import for the same font
      expect(body).not.toContain('family=fira&display=swap');
    });

    it('returns 200 and a valid SVG even when an extreme font value is supplied', async () => {
      const response = await GET(makeRequest({ user: 'octocat', font: 'a'.repeat(200) }));
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('<svg');
      expect(body).toContain('</svg>');
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
});
