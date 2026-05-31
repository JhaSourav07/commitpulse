import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

import { getWrappedData, fetchGitHubContributions } from '../../../lib/github';
import type { ContributionCalendar } from '../../../types';
import type { WrappedStats } from '../../../types/dashboard';

const mockCalendar: ContributionCalendar = {
  totalContributions: 1420,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2025-11-19' },
        { contributionCount: 42, date: '2025-11-20' },
        { contributionCount: 12, date: '2025-11-21' },
      ],
    },
  ],
};

const mockWrappedStats: WrappedStats = {
  totalContributions: 1420,
  mostActiveDate: '2025-11-20',
  highestDailyCount: 42,
  busiestMonth: '2025-11',
  weekendRatio: 24,
  topLanguage: 'TypeScript',
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/wrapped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
    } as unknown as import('../../../types').ExtendedContributionData);
  });

  describe('parameter validation', () => {
    it('returns 400 when the user parameter is missing', async () => {
      const response = await GET(makeRequest());
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
    });

    it('does not hit the GitHub API at all when user is missing', async () => {
      await GET(makeRequest());
      expect(getWrappedData).not.toHaveBeenCalled();
    });

    it('returns 400 for malformed GitHub usernames', async () => {
      const invalidUsers = ['http://localhost', 'harendra-', 'a--b', 'a'.repeat(40)];
      for (const user of invalidUsers) {
        const response = await GET(makeRequest({ user }));
        expect(response.status).toBe(400);
      }
      expect(getWrappedData).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid year format', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: 'abcd' }));
      expect(response.status).toBe(400);
    });

    it('returns 400 for years before GitHub existed', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '2007' }));
      expect(response.status).toBe(400);
    });

    it('returns 400 for future years', async () => {
      const futureYear = (new Date().getFullYear() + 1).toString();
      const response = await GET(makeRequest({ user: 'octocat', year: futureYear }));
      expect(response.status).toBe(400);
    });
  });

  describe('successful response', () => {
    it('returns 200 with SVG content type', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('returns a well-formed SVG body representing Wrapped stats', async () => {
      const response = await GET(makeRequest({ user: 'octocat', year: '2025' }));
      const body = await response.text();

      expect(body).toContain('<svg');
      expect(body).toContain('OCTOCAT');
      expect(body).toContain('2025 WRAPPED');
      expect(body).toContain('1420'); // Total contributions
      expect(body).toContain('TypeScript'); // Top language
      expect(body).toContain('42 COMMITS'); // Peak day
      expect(body).toContain('NOVEMBER'); // Busiest month
      expect(body).toContain('24%'); // Weekend ratio text
      expect(body).toContain('</svg>');
    });

    it('customizes the theme colors when theme parameter is neon', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'neon' }));
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('#ff00ff'); // Neon accent color
    });

    it('embeds custom background, accent, text overrides when provided', async () => {
      const response = await GET(
        makeRequest({ user: 'octocat', bg: 'ff0000', accent: '00ff00', text: '0000ff' })
      );
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('#ff0000');
      expect(body).toContain('#00ff00');
      expect(body).toContain('#0000ff');
    });

    it('supports autoTheme and embeds media queries for color schemes', async () => {
      const response = await GET(makeRequest({ user: 'octocat', theme: 'auto' }));
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('prefers-color-scheme: dark');
      expect(body).toContain('--cp-bg');
    });

    it('customizes dimensions when width and height parameters are passed', async () => {
      const response = await GET(makeRequest({ user: 'octocat', width: '500', height: '300' }));
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('width="500"');
      expect(body).toContain('height="300"');
    });

    it('customizes border corner radius when radius parameter is passed', async () => {
      const response = await GET(makeRequest({ user: 'octocat', radius: '15' }));
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('rx="15"');
    });
  });

  describe('cache-control header', () => {
    it('caches for 24 hours by default', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=86400, stale-while-revalidate=86400'
      );
    });

    it('bypasses the cache entirely when refresh=true is specified', async () => {
      const response = await GET(makeRequest({ user: 'octocat', refresh: 'true' }));
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
        bypassCache: true,
      });
    });
  });

  describe('security headers', () => {
    it('sets a strict Content-Security-Policy with safe SVG styling rules', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("style-src 'unsafe-inline'");
      expect(csp).toContain('https://fonts.googleapis.com');
    });
  });

  describe('error handling', () => {
    it('returns 500 with SVG error structure when fetch throws', async () => {
      vi.mocked(getWrappedData).mockRejectedValue(new Error('GitHub is down'));
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
      const body = await response.text();
      expect(body).toContain('Something went wrong. Please try again later.');
    });

    it('returns 404 with SVG error structure when user is not found', async () => {
      vi.mocked(getWrappedData).mockRejectedValue(new Error('User not found'));
      const response = await GET(makeRequest({ user: 'not-real-user' }));
      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
      const body = await response.text();
      expect(body).toContain('NOT FOUND');
    });

    it('returns 429 with SVG rate limit card when rate limited', async () => {
      vi.mocked(getWrappedData).mockRejectedValue(new Error('API Rate Limit Exceeded'));
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.status).toBe(429);
      const body = await response.text();
      expect(body).toContain('RATE LIMITED');
    });
  });
});
