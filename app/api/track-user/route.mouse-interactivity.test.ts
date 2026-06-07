import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { trackUserRateLimiter } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '4',
    'X-RateLimit-Reset': '999999',
  })),
  trackUserRateLimiter: {
    check: vi.fn().mockResolvedValue(true),
    checkWithResult: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    }),
  },
}));

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn(),
  },
}));

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({
    login: 'octocat',
  }),
}));

function makeRequest(body: Record<string, unknown>, headers?: HeadersInit): Request {
  return new Request('http://localhost/api/track-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('track-user mouse interactivity verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = undefined;
  });

  it('accepts standard interaction request payloads', async () => {
    const response = await POST(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(200);
  });

  it('handles repeated interaction requests consistently', async () => {
    const first = await POST(makeRequest({ username: 'octocat' }));

    const second = await POST(makeRequest({ username: 'octocat' }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it('preserves response shape across interaction events', async () => {
    const response = await POST(makeRequest({ username: 'octocat' }));

    const data = await response.json();

    expect(data).toHaveProperty('success');
  });

  it('returns rate-limit feedback when interaction volume exceeds limits', async () => {
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const response = await POST(
      makeRequest({ username: 'octocat' }, { 'x-real-ip': '198.51.100.10' })
    );

    expect(response.status).toBe(429);
  });

  it('handles malformed interaction payloads safely', async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
  });
});
