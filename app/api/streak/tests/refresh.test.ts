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
import type { ExtendedContributionData } from '../../../../types';

const mockCalendar = {
  totalContributions: 10,
  weeks: [],
};

describe('GET /api/streak - refresh parameter group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
  });

  it('returns status 200 for valid requests with custom refresh values', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const response = await GET(req as unknown as Request);
    expect(response.status).toBe(200);
  });

  it('correctly reflects changes dictated by the parameter by forwarding bypassCache to the fetcher', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    await GET(req as unknown as Request);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({ bypassCache: true })
    );
  });

  it('tests negative and fallback edge cases for invalid inputs of refresh', async () => {
    const invalidInputs = ['false', '1', 'yes', 'random', ''];

    for (const val of invalidInputs) {
      vi.clearAllMocks();
      const req = createRequest({
        method: 'GET',
        url: `http://localhost/api/streak?user=octocat&refresh=${val}`,
      });
      const response = await GET(req as unknown as Request);

      expect(response.status).toBe(200);
      expect(fetchGitHubContributions).toHaveBeenCalledWith(
        'octocat',
        expect.objectContaining({ bypassCache: false })
      );
      expect(response.headers.get('X-Cache-Status')).toBe('HIT');
    }
  });

  it('asserts that appropriate HTTP headers are returned in responses (cache bypass)', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const response = await GET(req as unknown as Request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('X-Cache-Status')).toMatch(/^BYPASS/);
  });

  it('asserts that appropriate HTTP headers are returned in responses (normal cache fallback)', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat',
    });
    const response = await GET(req as unknown as Request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
