import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchGitHubContributions } from '@/lib/github';
import type { ContributionCalendar, ExtendedContributionData } from '@/types';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

const mockCalendar: ContributionCalendar = {
  totalContributions: 120,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 4, date: '2024-01-01' },
        { contributionCount: 5, date: '2024-01-02' },
      ],
    },
  ],
};

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
): Request {
  const url = new URL('http://localhost/api/streak');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    headers: new Headers(headers),
  });
}

describe('ApiStreakRoute Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 Bad Request when the required user parameter is missing', async () => {
    const request = makeRequest({});
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.text();
    expect(body).toContain('<svg');
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
  });

  it('returns JSON data when format is set to json', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);

    const request = makeRequest({ user: 'octocat', format: 'json' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const json = await response.json();
    expect(json.user).toBe('octocat');
    expect(json.stats.totalContributions).toBe(120);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({
        bypassCache: false,
      })
    );
  });

  it('handles ETag / If-None-Match and returns 304 Not Modified', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);

    const request1 = makeRequest({ user: 'octocat', format: 'json' });
    const response1 = await GET(request1);
    const etag = response1.headers.get('ETag');
    expect(etag).toBeTruthy();

    const request2 = makeRequest({ user: 'octocat', format: 'json' }, { 'if-none-match': etag! });
    const response2 = await GET(request2);

    expect(response2.status).toBe(304);
    expect(await response2.text()).toBe('');
  });

  it('bypasses the cache and sets Cache-Control: no-store when refresh is true', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);

    const request = makeRequest({ user: 'octocat', format: 'json', refresh: 'true' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('X-Cache-Status')).toContain('BYPASS');
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({
        bypassCache: true,
      })
    );
  });

  it('returns SVG image content with Content-Security-Policy header by default', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);

    const request = makeRequest({ user: 'octocat' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none';");
    const svgText = await response.text();
    expect(svgText).toContain('<svg');
  });
});
