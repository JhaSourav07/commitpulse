import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from 'node-mocks-http';
import { GET } from '../route';

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

/**
 * Builds a native Request from node-mocks-http query params.
 * node-mocks-http is used as the mock request framework to define and
 * validate the parameter shape; the resulting URL is then handed to the
 * App Router handler which expects a native Request object.
 */
function makeRequest(params: Record<string, string> = {}): Request {
  // Use node-mocks-http to declare and validate the request shape
  const mock = createRequest({ method: 'GET', query: params });
  const url = new URL('http://localhost/api/streak');
  for (const [key, value] of Object.entries(mock.query as Record<string, string>)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/streak — languages (lang) parameter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
  });

  it('returns 200 with SVG content type when a valid lang=de is given', async () => {
    const response = await GET(makeRequest({ user: 'octocat', lang: 'de' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('returns a well-formed SVG body when lang=pt is given', async () => {
    const response = await GET(makeRequest({ user: 'octocat', lang: 'pt' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('<svg');
    expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(body).toContain('</svg>');
  });

  it('falls back to English labels when an unrecognised lang=zz is given', async () => {
    const response = await GET(makeRequest({ user: 'octocat', lang: 'zz' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('CURRENT_STREAK');
    expect(body).toContain('ANNUAL_SYNC_TOTAL');
    expect(body).toContain('PEAK_STREAK');
  });

  it('returns English labels when lang=en is explicitly provided', async () => {
    const response = await GET(makeRequest({ user: 'octocat', lang: 'en' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('CURRENT_STREAK');
    expect(body).toContain('PEAK_STREAK');
  });

  it('sets Cache-Control and Content-Security-Policy headers for a valid lang parameter', async () => {
    const response = await GET(makeRequest({ user: 'octocat', lang: 'de' }));

    expect(response.headers.get('Cache-Control')).toMatch(/public, s-maxage=\d+/);
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("style-src 'unsafe-inline'");
  });
});
