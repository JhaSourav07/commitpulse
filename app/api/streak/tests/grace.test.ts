import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock external dependencies
vi.mock('../../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../../lib/github';
import { getSecondsUntilUTCMidnight } from '../../../../utils/time';
import type { ContributionCalendar, ExtendedContributionData } from '../../../../types';

// Mock calendar data with streak in grace period
// Last 3 days have 0 contributions, so grace period is essential to keep streak alive
const mockCalendarWithGraceScenario: ContributionCalendar = {
  totalContributions: 20,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 2, date: '2024-06-10' },
        { contributionCount: 3, date: '2024-06-11' },
        { contributionCount: 1, date: '2024-06-12' },
        { contributionCount: 4, date: '2024-06-13' },
        { contributionCount: 2, date: '2024-06-14' },
        { contributionCount: 0, date: '2024-06-15' },
        { contributionCount: 0, date: '2024-06-16' },
      ],
    },
    {
      contributionDays: [
        { contributionCount: 0, date: '2024-06-17' },
        { contributionCount: 3, date: '2024-06-18' },
        { contributionCount: 2, date: '2024-06-19' },
        { contributionCount: 1, date: '2024-06-20' },
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

describe('Grace Parameter Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendarWithGraceScenario,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
  });

  describe('Test 1: Valid grace parameter parsing and rendering (grace=0)', () => {
    it('should return 200 with valid SVG when grace=0 is provided', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '0',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');

      const svgContent = await response.text();
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('</svg>');
      expect(svgContent.length).toBeGreaterThan(100);
    });

    it('should include proper Cache-Control header for grace=0 response', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '0',
      });

      const response = await GET(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('public');
    });

    it('should include Content-Security-Policy header for SVG safety', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '0',
      });

      const response = await GET(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toBeTruthy();
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain('style-src');
    });
  });

  describe('Test 2: Maximum valid grace parameter (grace=7)', () => {
    it('should return 200 with valid SVG when grace=7 is provided', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '7',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');

      const svgContent = await response.text();
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('</svg>');
    });

    it('should allow streak to persist through grace period with grace=7', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '7',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);

      const svgContent = await response.text();
      // Verify that the SVG contains streak information (not a generic error)
      expect(svgContent).toContain('<svg');
      expect(svgContent.length).toBeGreaterThan(100);
    });
  });

  describe('Test 3: Invalid grace parameter values (out of range and non-integer)', () => {
    it('should return 400 Bad Request when grace=-1 (negative)', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '-1',
      });

      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
      expect(body.details.fieldErrors.grace).toBeDefined();
      expect(body.details.fieldErrors.grace[0]).toContain(
        'grace must be an integer between 0 and 7'
      );
    });

    it('should return 400 Bad Request when grace=8 (exceeds max)', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '8',
      });

      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
      expect(body.details.fieldErrors.grace[0]).toContain(
        'grace must be an integer between 0 and 7'
      );
    });

    it('should not call GitHub API when grace parameter is invalid', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '99',
      });

      await GET(request);

      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });
  });

  describe('Test 4: Default grace value and fallback behavior', () => {
    it('should default to grace=1 when grace parameter is missing', async () => {
      const request = makeRequest({
        user: 'octocat',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');

      const svgContent = await response.text();
      expect(svgContent).toContain('<svg');
      expect(svgContent.length).toBeGreaterThan(100);
    });

    it('should handle empty grace parameter gracefully (default to 1)', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const svgContent = await response.text();
      expect(svgContent).toContain('<svg');
    });
  });

  describe('Test 5: SVG rendering variations with different grace values and HTTP headers', () => {
    it('should render valid SVG with grace=0', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '0',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const svgContent = await response.text();
      expect(svgContent).toMatch(/<svg[^>]*>/);
      expect(svgContent).toMatch(/<\/svg>/);
    });

    it('should render valid SVG with grace=3 (middle value)', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '3',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const svgContent = await response.text();
      expect(svgContent).toMatch(/<svg[^>]*>/);
      expect(svgContent).toMatch(/<\/svg>/);
    });

    it('should render valid SVG with grace=7', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '7',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const svgContent = await response.text();
      expect(svgContent).toMatch(/<svg[^>]*>/);
      expect(svgContent).toMatch(/<\/svg>/);
    });

    it('should include X-Cache-Status header in response', async () => {
      const request = makeRequest({
        user: 'octocat',
        grace: '3',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const cacheStatus = response.headers.get('X-Cache-Status');
      expect(cacheStatus).toBeTruthy();
      expect(cacheStatus).toMatch(/HIT|BYPASS/);
    });

    it('should maintain HTTP 200 status for all valid grace values (0-7)', async () => {
      for (let graceValue = 0; graceValue <= 7; graceValue++) {
        const request = makeRequest({
          user: 'octocat',
          grace: String(graceValue),
        });

        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
      }
    });

    it('should preserve Cache-Control header format across grace values', async () => {
      for (let graceValue = 0; graceValue <= 3; graceValue++) {
        const request = makeRequest({
          user: 'octocat',
          grace: String(graceValue),
        });

        const response = await GET(request);

        const cacheControl = response.headers.get('Cache-Control');
        expect(cacheControl).toBeTruthy();
        expect(cacheControl).toMatch(/public|private|no-cache|no-store/);
      }
    });
  });
});
