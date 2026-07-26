import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: vi.fn().mockImplementation(function () {
    return { check: vi.fn().mockResolvedValue(true) };
  }),
}));
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

function makeRequest(search: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost:3000/api/compare?${search}`, { headers });
}

describe('GET /api/compare - Empty & Missing Input Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when user1 is an empty string', async () => {
    const res = await GET(makeRequest('user1=&user2=octocat'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid parameters');
    expect(data.details.fieldErrors.user1).toBeDefined();
  });

  it('returns 400 when user2 is only whitespace', async () => {
    const res = await GET(makeRequest('user1=octocat&user2=%20%20%20'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid parameters');
    expect(data.details.fieldErrors.user2).toBeDefined();
  });

  it('returns 400 when query string is completely empty', async () => {
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid parameters');
    expect(data.details.fieldErrors.user1).toBeDefined();
    expect(data.details.fieldErrors.user2).toBeDefined();
  });

  it('handles empty/minimal dashboard response from upstream gracefully', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({} as never);

    const res = await GET(makeRequest('user1=alice&user2=bob'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user1).toEqual({});
    expect(data.user2).toEqual({});
  });

  it('returns 200 and includes ETag/Cache-Control when If-None-Match header is missing', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({ profile: { username: 'test' } } as never);

    const res = await GET(makeRequest('user1=alice&user2=bob'));
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBeTruthy();
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=1');
  });

  it('returns 200 when If-None-Match is an empty string instead of crashing', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({ profile: { username: 'test' } } as never);

    const res = await GET(makeRequest('user1=alice&user2=bob', { 'if-none-match': '' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBeTruthy();
  });
});
