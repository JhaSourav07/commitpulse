import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

const rateLimitMock = vi.fn(async () => ({
  success: true,
  limit: 30,
  remaining: 29,
  reset: Date.now() + 60000,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
  getRateLimitHeaders: () => ({}),
}));

const { POST } = await import('./route');

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/team-attribution', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/team-attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns attribution metrics for valid commits', async () => {
    const res = await POST(
      makeRequest({
        commits: [
          { author: 'alice', date: '2026-06-01T10:00:00Z', additions: 10 },
          { author: 'alice', date: '2026-06-02T10:00:00Z' },
          { author: 'bob', date: '2026-06-03T10:00:00Z' },
        ],
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalCommits).toBe(3);
    expect(data.authors[0].author).toBe('alice');
    expect(data.busFactor).toBe(1);
  });

  it('rejects invalid JSON', async () => {
    const res = await POST(makeRequest('{nope'));
    expect(res.status).toBe(400);
  });

  it('rejects a missing commits array', async () => {
    const res = await POST(makeRequest({ commits: 'not-an-array' }));
    expect(res.status).toBe(400);
  });

  it('rejects commits with malformed entries', async () => {
    const res = await POST(makeRequest({ commits: [{ author: 'x', date: 'not-a-date' }] }));
    expect(res.status).toBe(422);
  });

  it('rejects oversized commit lists', async () => {
    const commits = Array.from({ length: 10_001 }, () => ({
      author: 'a',
      date: '2026-06-01T00:00:00Z',
    }));
    const res = await POST(makeRequest({ commits }));
    expect(res.status).toBe(413);
  });

  it('enforces the rate limit', async () => {
    rateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    const res = await POST(makeRequest({ commits: [] }));
    expect(res.status).toBe(429);
  });
});
