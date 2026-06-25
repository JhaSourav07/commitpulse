import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from './route';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

vi.mock('@/models/Notification', () => ({
  Notification: {
    deleteOne: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => {
  const mockResult = { success: true, limit: 60, remaining: 59, reset: Date.now() + 60000 };
  return {
    notifyRateLimiter: {
      checkWithResult: vi.fn().mockResolvedValue(mockResult),
    },
    getRateLimitHeaders: vi.fn(() => ({
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': '59',
      'X-RateLimit-Reset': String(Date.now() + 60000),
      'Retry-After': '60',
    })),
  };
});

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({ verified: true }),
}));

import { Notification } from '@/models/Notification';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/notify?${query}`, { method: 'DELETE' });
}

describe('DELETE /api/notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/test');
    vi.stubEnv('NODE_ENV', 'test');
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    });
    vi.mocked(verifyGitHubOwner).mockResolvedValue({ verified: true });
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(429);
  });

  it('bypasses gracefully when MONGODB_URI is not set in development', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'development');

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toContain('bypassed');
  });

  it('returns 404 when notification preferences do not exist', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null);

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(404);

    const data = await res.json();

    expect(data.message).toContain('No notification preferences found');
  });

  it('returns 200 when notification preferences are deleted successfully', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(Notification.deleteOne).mockResolvedValue({ deletedCount: 1 } as never);

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted successfully');
  });
});
