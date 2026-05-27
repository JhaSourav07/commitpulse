/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

import { getFullDashboardData } from '@/lib/github';
import { ipRateLimiter } from '../../../lib/rate-limiter';

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
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with JSON content on a successful fetch', async () => {
    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profile.username).toBe('octocat');
    expect(getFullDashboardData).toHaveBeenCalledWith('octocat', { bypassCache: false });
  });

  it('returns 400 when username is missing', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    vi.spyOn(ipRateLimiter, 'isLimitExceeded').mockReturnValue(true);

    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toContain('Too many requests');
  });

  it('returns 404 when user is not found', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('User not found'));

    const response = await GET(makeRequest({ username: 'ghost' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('returns 403 when GitHub rate limit is exceeded', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('status 403'));

    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('rate limit reached');
  });
});
