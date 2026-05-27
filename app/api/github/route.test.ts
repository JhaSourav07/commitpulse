import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

import { getFullDashboardData } from '@/lib/github';

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/github');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return new Request(url.toString());
}

describe('GET /api/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { username: 'octocat' },
      repositories: [],
      languages: [],
      insights: [],
      commitClock: [],
    } as never);
  });

  it('returns a standards-compliant Cache-Control header', async () => {
    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      's-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('bypasses cache with refresh=true', async () => {
    const response = await GET(makeRequest({ username: 'octocat', refresh: 'true' }));

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(getFullDashboardData).toHaveBeenCalledWith('octocat', { bypassCache: true });
  });
});
