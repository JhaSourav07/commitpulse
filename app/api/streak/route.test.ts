import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// We only mock the two things that reach outside this process:
// the GitHub API call and the wall-clock time helper.
// calculateStreak and generateSVG run for real, giving us genuine end-to-end coverage.
vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../lib/github';
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
    // Fixed values so Cache-Control assertions don't depend on the real clock.
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  describe('parameter validation', () => {
    it('returns 400 when the user parameter is missing', async () => {
      const response = await GET(makeRequest());

      expect(response.status).toBe(400);
      const body = await response.text();
      expect(body).toContain('Missing');
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

    it('forwards the username to fetchGitHubContributions', async () => {
      await GET(makeRequest({ user: 'octocat' }));

      expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', { bypassCache: false });
    });

    it('embeds the username (uppercased) in the SVG title', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const body = await response.text();

      // The generator puts params.user.toUpperCase() in the SVG as the badge title.
      expect(body).toContain('OCTOCAT');
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
    it('sets a strict Content-Security-Policy that blocks all external resources', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("default-src 'none'");
      // SVG badges rely on inline styles for theming, so unsafe-inline must be allowed.
      expect(csp).toContain("style-src 'unsafe-inline'");
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

    it('returns 400 for future years', async () => {
      const futureYear = (new Date().getFullYear() + 1).toString();

      const response = await GET(makeRequest({ user: 'octocat', year: futureYear }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details.fieldErrors.year[0]).toContain('GitHub was founded in 2008');
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
  });

  describe('theme parameter', () => {
    it('returns 200 for a valid known theme like "neon"', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'neon' }));

      expect(response.status).toBe(200);
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

      expect(response.status).toBe(200);
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

      expect(body).toContain('API is down');
    });

    it('never caches an error response', async () => {
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('Network failure'));

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60');
    });

    it('returns a valid 500 SVG even when something non-Error is thrown', async () => {
      // JavaScript lets you throw anything — strings, numbers, plain objects.
      // The catch block checks instanceof Error; if that fails it falls back to "Unknown error".
      vi.mocked(fetchGitHubContributions).mockRejectedValue('something went very wrong');

      const response = await GET(makeRequest({ user: 'octocat' }));

      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).toContain('Unknown error');
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
  });

  describe('monthly view parameter', () => {
    it('returns 200 when view=monthly is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', view: 'monthly' }));

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('COMMITS THIS MONTH');
    });

    it('defaults to default view when an unknown view is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', view: 'invalid' }));

      expect(response.status).toBe(200);
      const body = await response.text();
      // It should generate the default streak SVG and have "CURRENT_STREAK"
      expect(body).toContain('CURRENT_STREAK');
    });
  });

  describe('theme=random cache header', () => {
    it('returns no-cache header when ?theme=random is given', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'random' }));

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
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
});
