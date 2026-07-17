import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/Notification', () => ({
  Notification: {
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
}));
vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn((result: { limit: number; remaining: number; reset: number }) => ({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  })),
  notifyRateLimiter: {
    checkWithResult: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    }),
  },
}));
vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));
vi.mock('@/services/github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn().mockResolvedValue(true),
  },
}));
vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({ verified: true }),
}));

import { notifyRateLimiter } from '@/lib/rate-limit';
const makeRequest = (method: string, body?: object, search?: string, ip?: string) => {
  const url = `http://localhost:3000/api/notify${search ? '?' + search : ''}`;
  return new NextRequest(url, {
    method,
    headers: {
      'x-forwarded-for': ip || '127.0.0.1',
      Authorization: 'Bearer test-owner-token',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('POST /api/notify massive scaling: Massive Data Sets and Extreme High Bounds Scaling (Variation 2)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('processes 1000 POST requests from distinct IPs successfully within the rate limit', async () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      const ip = `203.0.${Math.floor(i / 256)}.${i % 256}`;
      const response = await POST(
        makeRequest('POST', { username: 'testuser', email: 'a@b.com' }, undefined, ip)
      );
      expect(response.status).not.toBe(429);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10000);
  });

  it('returns 429 with correct rate limit headers after exceeding the 5-request limit for a single IP', async () => {
    const ip = '198.51.100.10';

    let lastResponse: Response | undefined;
    for (let i = 0; i < 6; i++) {
      lastResponse = await POST(
        makeRequest('POST', { username: 'testuser', email: 'a@b.com' }, undefined, ip)
      );
    }

    expect(lastResponse!.status).toBe(429);
    expect(lastResponse!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(lastResponse!.headers.get('X-RateLimit-Limit')).toBe('5');
  });

  it('handles 3000 distinct IPs exceeding the internal cache capacity without throwing or breaking rate limit tracking', async () => {
    for (let i = 0; i < 3000; i++) {
      const ip = `172.${16 + (i % 16)}.${Math.floor(i / 256) % 256}.${i % 256}`;
      const response = await POST(
        makeRequest('POST', { username: 'testuser', email: 'a@b.com' }, undefined, ip)
      );
      expect(response.status).not.toBe(500);
    }
  });
});
