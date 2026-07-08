import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { Notification } from '@/models/Notification';
import { gitHubUserValidator } from '@/services/github/validate-user';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

// ─── mocks ─────────────────────────────────────────────
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

vi.mock('@/models/Notification', () => ({
  Notification: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/services/github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/rate-limit', () => ({
  notifyRateLimiter: {
    checkWithResult: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now(),
    }),
  },
  getRateLimitHeaders: vi.fn(() => ({})),
}));

// ─── SAFE CACHE ─────────────────────────────────────────
const cacheStore = new Map<string, number>();

vi.mock('@/lib/cache', () => ({
  DistributedCache: class {
    async get(key: string) {
      return cacheStore.get(key);
    }

    async set(key: string, value: number) {
      cacheStore.set(key, value);
    }
  },
}));

// ─── typed mocks (IMPORTANT FIX) ────────────────────────
const validateUserMock = vi.mocked(gitHubUserValidator.validateUser);
const verifyOwnerMock = vi.mocked(verifyGitHubOwner);
const findOneMock = vi.mocked(Notification.findOne);
const findOneAndUpdateMock = vi.mocked(Notification.findOneAndUpdate);

// ─── helper ─────────────────────────────────────────────
const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/notify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

// ─── tests ─────────────────────────────────────────────
describe('POST /api/notify - mock integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
    process.env.MONGODB_URI = 'mongodb://test';
  });

  it('cache miss proceeds through full async flow', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });

    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
    });

    const res = await POST(
      makeRequest({
        username: 'testuser',
        email: 'test@example.com',
        frequency: 'daily',
        preferences: {
          notifyOnCommit: true,
          notifyOnStreak: true,
          notifyOnMilestone: true,
        },
      })
    );

    expect(res.status).toBe(200);
  });

  it('cache hit prevents DB write', async () => {
    cacheStore.set('notify:write:cacheduser', Date.now());

    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });

    const res = await POST(
      makeRequest({
        username: 'cacheduser',
        email: 'test@example.com',
        frequency: 'daily',
        preferences: {
          notifyOnCommit: true,
          notifyOnStreak: true,
          notifyOnMilestone: true,
        },
      })
    );

    expect(res.status).toBe(429);
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it('invalid GitHub user returns 404', async () => {
    validateUserMock.mockResolvedValue(false);

    const res = await POST(
      makeRequest({
        username: 'ghostuser',
        email: 'test@example.com',
        frequency: 'daily',
        preferences: {
          notifyOnCommit: true,
          notifyOnStreak: true,
          notifyOnMilestone: true,
        },
      })
    );

    expect(res.status).toBe(404);
  });

  it('database failure returns 500', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });

    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockRejectedValue(new Error('DB error'));

    const res = await POST(
      makeRequest({
        username: 'testuser',
        email: 'test@example.com',
        frequency: 'daily',
        preferences: {
          notifyOnCommit: true,
          notifyOnStreak: true,
          notifyOnMilestone: true,
        },
      })
    );

    expect(res.status).toBe(500);
  });

  it('successful write returns 200', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });

    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
    });

    const res = await POST(
      makeRequest({
        username: 'testuser',
        email: 'test@example.com',
        frequency: 'daily',
        preferences: {
          notifyOnCommit: true,
          notifyOnStreak: true,
          notifyOnMilestone: true,
        },
      })
    );

    const body = await res.json().catch(() => ({}));

    expect(res.status).toBe(200);
    expect(body.success ?? true).toBe(true);
  });
});
