import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from './route';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Notification', () => ({
  Notification: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  notifyRateLimiter: {
    checkWithResult: vi.fn(),
  },
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': '123456789',
  })),
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn(),
}));

vi.mock('@/lib/notification-management-token', () => ({
  createNotificationManagementToken: vi.fn(),
  getNotificationManagementToken: vi.fn(() => null),
  hashNotificationManagementToken: vi.fn(),
  verifyNotificationManagementToken: vi.fn(() => false),
}));

import { Notification } from '@/models/Notification';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

const makeRequest = (search = '') => {
  return new NextRequest(`http://localhost:3000/api/notify${search ? `?${search}` : ''}`, {
    method: 'DELETE',
    headers: {
      'x-forwarded-for': '127.0.0.1',
    },
  });
};

describe('DELETE /api/notify', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env = {
      ...originalEnv,
      MONGODB_URI: 'mongodb://localhost/test',
    };

    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    });

    vi.mocked(verifyGitHubOwner).mockResolvedValue({
      verified: true,
    });

    vi.mocked(Notification.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        username: 'testuser',
        managementTokenHash: 'hash',
      }),
    } as never);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 when user parameter is missing', async () => {
    const res = await DELETE(makeRequest());

    expect(res.status).toBe(400);
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
    delete process.env.MONGODB_URI;

    vi.stubEnv('NODE_ENV', 'development');

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toContain('bypassed');
  });

  it('returns 404 when notification preferences do not exist', async () => {
    vi.mocked(Notification.deleteOne).mockResolvedValue({
      deletedCount: 0,
    } as never);

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(404);

    const data = await res.json();

    expect(data.message).toContain('No notification preferences found');
  });

  it('returns 200 when notification preferences are deleted successfully', async () => {
    vi.mocked(Notification.deleteOne).mockResolvedValue({
      deletedCount: 1,
    } as never);

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted successfully');
  });
});
