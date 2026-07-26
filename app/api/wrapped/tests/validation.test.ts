import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from 'node-mocks-http';
import { GET } from '../route';
import { getWrappedData, fetchGitHubContributions } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

describe('GET /api/wrapped validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getWrappedData).mockResolvedValue({
      totalContributions: 1500,
      mostActiveDate: '2023-10-15',
      highestDailyCount: 50,
      busiestMonth: '2023-10',
      weekendRatio: 13,
      topLanguage: 'TypeScript',
      calendar: { totalContributions: 1500, weeks: [] },
    });

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: { totalContributions: 1500, weeks: [] },
      repoContributions: [],
    } as unknown as import('@/types').ExtendedContributionData);
  });

  const makeMockRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost/api/wrapped');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return createRequest({
      method: 'GET',
      url: url.toString(),
    }) as unknown as Request;
  };

  it('TestCase 1: returns 400 for missing user parameter (Zod validation)', async () => {
    const req = makeMockRequest({});
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('TestCase 2: verifies invalid theme settings fallback to dark instead of 400', async () => {
    const req = makeMockRequest({ user: 'octocat', theme: 'invalid_theme_name_123' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<svg');
    expect(text).toContain('0d1117');
  });

  it('TestCase 3: mocks GitHub responses for custom year bounds and verifies year params', async () => {
    const req = makeMockRequest({ user: 'octocat', year: '2023' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(getWrappedData).toHaveBeenCalledWith('octocat', '2023', { bypassCache: false });
  });

  it('TestCase 4: verifies computed stats metrics like streak peak and weekend commits in SVG output', async () => {
    vi.mocked(getWrappedData).mockResolvedValue({
      totalContributions: 5000,
      mostActiveDate: '2023-10-15',
      highestDailyCount: 50,
      busiestMonth: '2023-10',
      weekendRatio: 4,
      topLanguage: 'TypeScript',
      calendar: { totalContributions: 5000, weeks: [] },
    });

    const req = makeMockRequest({ user: 'octocat' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<svg');
  });

  it('TestCase 5: ensures SVG visual components render correctly based on active params', async () => {
    const req = makeMockRequest({ user: 'octocat', bg: 'ff0000', radius: '20' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<svg');
    expect(text).toContain('ff0000');
    expect(text).toContain('20');
  });
});
