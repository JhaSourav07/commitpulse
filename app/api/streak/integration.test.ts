/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/streak/integration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { globalRateLimiter } from '../../../middleware/rate-limit';

function makeRequest(params: Record<string, string>, ip = '127.0.0.1'): Request {
  const query = new URLSearchParams(params).toString();
  return new Request(`http://localhost:3000/api/streak?${query}`, {
    headers: {
      'x-forwarded-for': ip,
      'x-test-rate-limit': 'true', // force rate limit execution in tests
    },
  });
}

const mockCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [{ contributionCount: 1, date: '2026-05-01', color: '#ffee00' }],
    },
  ],
};

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Cost-Based Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
    // Configure rate limiter with appropriate capacity to cover query complexity of ~1538
    // maxTokens = 2000, refillRate = 100/sec (0.1/ms), maxQueueWait = 1000ms
    (globalRateLimiter as any).maxTokens = 2000;
    (globalRateLimiter as any).refillRate = 100 / 1000;
    (globalRateLimiter as any).maxQueueWaitMs = 1000;
    globalRateLimiter.clear();
    // Stub GITHUB_TOKEN so that getGitHubToken() does not throw in tests
    vi.stubEnv('GITHUB_TOKEN', 'mock-github-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalRateLimiter.clear();
  });

  it('sets query complexity and rate limit headers on a successful request', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    const response = await GET(makeRequest({ user: 'octocat' }, '10.0.0.1'));
    if (response.status === 500) {
      console.log('500 ERROR BODY:', await response.text());
    }
    expect(response.status).toBe(200);

    expect(response.headers.get('X-Query-Complexity')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Limit')).toBe('2000');
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Wait-Time')).toBe('0');
  });

  it('queues/defers execution for requests that exceed immediate capacity but are within queue threshold', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    // Set maxTokens to 1600. First request takes ~1538 tokens, leaving ~62 tokens.
    // Second request takes ~1538 tokens. Proposed remaining: 62 - 1538 = -1476.
    // Wait time: 1476 / 0.1 = 14760 ms.
    // 14760 ms > 1000 ms (maxQueueWaitMs), so second request will be rejected.
    (globalRateLimiter as any).maxTokens = 1600;

    const response1 = await GET(makeRequest({ user: 'octocat' }, '10.0.0.2'));
    expect(response1.status).toBe(200);

    const response2 = await GET(makeRequest({ user: 'octocat' }, '10.0.0.2'));
    expect(response2.status).toBe(429);

    const body = await response2.text();
    expect(body).toContain('429: Rate Limit Exceeded');
  });

  it('isolates different users/IPs', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    // Set maxTokens to 1600.
    (globalRateLimiter as any).maxTokens = 1600;

    // IP 10.0.0.4 makes a request, consuming ~1538 tokens.
    const res1 = await GET(makeRequest({ user: 'octocat' }, '10.0.0.4'));
    expect(res1.status).toBe(200);

    // A second request for IP 10.0.0.4 is blocked (429) due to insufficient tokens.
    const res2 = await GET(makeRequest({ user: 'octocat' }, '10.0.0.4'));
    expect(res2.status).toBe(429);

    // But IP 10.0.0.5 has not made any requests yet, so it should succeed immediately!
    const res3 = await GET(makeRequest({ user: 'octocat' }, '10.0.0.5'));
    expect(res3.status).toBe(200);
  });
});
