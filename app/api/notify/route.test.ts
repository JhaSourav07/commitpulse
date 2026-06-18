import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, GET, POST } from './route';
import dbConnect from '@/lib/mongodb';
import { hashNotificationManagementToken } from '@/lib/notification-management-token';

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
  getRateLimitHeaders: vi.fn((result) => ({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  })),
  notifyRateLimiter: {
    check: vi.fn().mockResolvedValue(true),
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

import { Notification } from '@/models/Notification';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { gitHubUserValidator } from '@/services/github/validate-user';
import { getClientIp } from '@/utils/getClientIp';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

const makeRequest = (method: string, body?: object, search?: string) => {
  const url = `http://localhost:3000/api/notify${search ? '?' + search : ''}`;
  return new NextRequest(url, {
    method,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      Authorization: 'Bearer test-owner-token',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('POST /api/notify', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.check).mockResolvedValue(true);
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);
    vi.mocked(verifyGitHubOwner).mockResolvedValue({ verified: true });
    vi.mocked(Notification.findOne).mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('returns 400 when username is missing', async () => {
    const res = await POST(makeRequest('POST', { email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest('POST', { username: 'testuser' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await POST(makeRequest('POST', { username: 'testuser', email: 'notanemail' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid frequency', async () => {
    const res = await POST(
      makeRequest('POST', { username: 'testuser', email: 'a@b.com', frequency: 'monthly' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid GitHub username format', async () => {
    const res = await POST(makeRequest('POST', { username: '-invalid', email: 'a@b.com' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('Invalid GitHub username');
  });

  it('returns 400 for username exceeding 39 characters', async () => {
    const res = await POST(makeRequest('POST', { username: 'a'.repeat(40), email: 'a@b.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const url = 'http://localhost:3000/api/notify';
    const req = new NextRequest(url, {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1', 'content-type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('Malformed JSON');
    expect(dbConnect).not.toHaveBeenCalled();
  });

  // ── Rate limiting ────────────────────────────────────────────────────────

  it('returns 429 when rate limited', async () => {
    const reset = Date.now() + 60000;
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset,
    });
    const res = await POST(makeRequest('POST', { username: 'testuser', email: 'a@b.com' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('x-ratelimit-limit')).toBe('5');
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(res.headers.get('x-ratelimit-reset')).toBe(reset.toString());
  });

  it('returns 401 when GitHub authentication is missing or invalid', async () => {
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 401,
      message: 'GitHub authentication is required.',
    });

    const res = await POST(makeRequest('POST', { username: 'testuser', email: 'a@b.com' }));

    expect(res.status).toBe(401);
    expect(Notification.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when the authenticated GitHub account does not own the username', async () => {
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 403,
      message: 'The authenticated GitHub account does not own this username.',
    });

    const res = await POST(makeRequest('POST', { username: 'victim', email: 'a@b.com' }));

    expect(res.status).toBe(403);
    expect(verifyGitHubOwner).toHaveBeenCalledWith(expect.any(Request), 'victim');
    expect(Notification.findOneAndUpdate).not.toHaveBeenCalled();
  });

  // ── Per-username write cooldown ───────────────────────────────────────────

  it('returns 429 when same username is written within cooldown period', async () => {
    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      username: 'cooldownuser',
      email: 'a@b.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const body = { username: 'cooldownuser', email: 'a@b.com' };
    const first = await POST(makeRequest('POST', body));
    expect(first.status).toBe(200);

    const second = await POST(makeRequest('POST', body));
    expect(second.status).toBe(429);
    const data = await second.json();
    expect(data.message).toMatch(/Please wait \d+ seconds? before updating/);
  });

  // ── GitHub user existence check ──────────────────────────────────────────

  it('returns 404 when GitHub username does not exist', async () => {
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(false);
    const res = await POST(makeRequest('POST', { username: 'nonexistent', email: 'a@b.com' }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toContain('GitHub user not found');
  });

  // ── MONGODB_URI handling ──────────────────────────────────────────────────

  it('returns 500 when MONGODB_URI is not set in production', async () => {
    delete process.env.MONGODB_URI;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(makeRequest('POST', { username: 'testuser', email: 'a@b.com' }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.message).toContain('Database configuration error');
  });

  it('bypasses gracefully when MONGODB_URI is not set in development', async () => {
    delete process.env.MONGODB_URI;
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(makeRequest('POST', { username: 'testuser', email: 'a@b.com' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('bypassed');
  });

  // ── Success ──────────────────────────────────────────────────────────────

  it('returns 200 and saves preferences successfully', async () => {
    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      username: 'testuser',
      email: 'a@b.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const res = await POST(
      makeRequest('POST', {
        username: 'testuser',
        email: 'a@b.com',
        frequency: 'daily',
        preferences: { notifyOnCommit: true, notifyOnStreak: true, notifyOnMilestone: true },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.username).toBe('testuser');
    expect(data.data.email).toBe('a***@b***.com');
    expect(data.managementToken).toMatch(/^cpn_/);
  });

  it('defaults frequency to daily and preferences to true when omitted', async () => {
    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      username: 'defaultuser',
      email: 'a@b.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const res = await POST(makeRequest('POST', { username: 'defaultuser', email: 'a@b.com' }));
    expect(res.status).toBe(200);
  });

  it('rejects attempts to overwrite an existing subscription without ownership proof', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'victim',
      email: 'victim@example.com',
      managementTokenHash: hashNotificationManagementToken('real-management-token'),
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 401,
      message: 'GitHub authentication is required.',
    });

    const res = await POST(
      makeRequest('POST', {
        username: 'victim',
        email: 'attacker@example.com',
        frequency: 'weekly',
      })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.message).toContain('management token');
    expect(Notification.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('allows updates with a valid notification management token', async () => {
    const managementToken = 'valid-management-token';
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'tokenuser',
      email: 'old@example.com',
      managementTokenHash: hashNotificationManagementToken(managementToken),
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      username: 'tokenuser',
      email: 'new@example.com',
      frequency: 'weekly',
      notifyOnCommit: true,
      notifyOnStreak: false,
      notifyOnMilestone: true,
    } as never);

    const res = await POST(
      makeRequest('POST', {
        username: 'tokenuser',
        email: 'new@example.com',
        frequency: 'weekly',
        managementToken,
        preferences: { notifyOnCommit: true, notifyOnStreak: false, notifyOnMilestone: true },
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.email).toBe('ne***@ex***.com');
    expect(data.managementToken).toBeUndefined();
    expect(verifyGitHubOwner).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/notify', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.check).mockResolvedValue(true);
    vi.mocked(verifyGitHubOwner).mockResolvedValue({ verified: true });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects deletion when the authenticated account does not own the username', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'victim',
      email: 'victim@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 403,
      message: 'The authenticated GitHub account does not own this username.',
    });

    const res = await DELETE(makeRequest('DELETE', undefined, 'user=victim'));

    expect(res.status).toBe(403);
    expect(Notification.deleteOne).not.toHaveBeenCalled();
  });

  it('deletes preferences after ownership is verified', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(Notification.deleteOne).mockResolvedValue({ deletedCount: 1 } as never);

    const res = await DELETE(makeRequest('DELETE', undefined, 'user=testuser'));

    expect(res.status).toBe(200);
    expect(verifyGitHubOwner).toHaveBeenCalledWith(expect.any(Request), 'testuser');
    expect(Notification.deleteOne).toHaveBeenCalledWith({ username: 'testuser' });
  });
});

describe('GET /api/notify', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.check).mockResolvedValue(true);
    vi.mocked(Notification.findOne).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('returns 400 when username is missing', async () => {
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid GitHub username format', async () => {
    const res = await GET(makeRequest('GET', undefined, 'user=-invalid'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('Invalid GitHub username');
  });

  // ── Rate limiting ────────────────────────────────────────────────────────

  it('returns 429 when rate limited', async () => {
    const reset = Date.now() + 60000;
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset,
    });
    const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
    expect(res.status).toBe(429);
    expect(res.headers.get('x-ratelimit-limit')).toBe('5');
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(res.headers.get('x-ratelimit-reset')).toBe(reset.toString());
  });

  it('applies rate limiting via user-agent fallback when IP is unknown', async () => {
    // Simulates a client behind a misconfigured proxy where getClientIp returns 'unknown'.
    // Previously the entire rate-limit block was skipped for these clients.
    vi.mocked(getClientIp).mockReturnValueOnce('unknown');

    const reset = Date.now() + 60000;
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset,
    });

    const url = 'http://localhost:3000/api/notify?user=testuser';
    const req = new NextRequest(url, {
      method: 'GET',
      headers: { 'user-agent': 'test-agent' },
    });

    const res = await GET(req);

    // Must be rate limited even without a resolvable IP
    expect(res.status).toBe(429);
    // Verify checkWithResult was called with the user-agent fallback key
    expect(notifyRateLimiter.checkWithResult).toHaveBeenCalledWith('unknown:test-agent');
  });

  // ── MONGODB_URI handling ──────────────────────────────────────────────────

  it('returns 500 when MONGODB_URI is not set in production', async () => {
    delete process.env.MONGODB_URI;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
    expect(res.status).toBe(500);
  });

  it('bypasses gracefully when MONGODB_URI is not set in development', async () => {
    delete process.env.MONGODB_URI;
    vi.stubEnv('NODE_ENV', 'development');
    const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('no database configured');
  });

  // ── Data fetching ────────────────────────────────────────────────────────

  it('returns 404 when user not found', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null);
    const res = await GET(makeRequest('GET', undefined, 'user=nobody'));
    expect(res.status).toBe(404);
  });

  it('returns 200 with preferences when user exists', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'a@b.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.username).toBe('testuser');
  });

  it('masks the email address in GET responses to prevent PII exposure', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'john.doe@gmail.com',
      frequency: 'weekly',
      notifyOnCommit: true,
      notifyOnStreak: false,
      notifyOnMilestone: true,
    } as never);

    const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
    const body = await res.json();

    expect(res.status).toBe(200);
    // Assert the exact masked output for a known input
    expect(body.data.email).toBe('jo***@gm***.com');
    // The full email must never be returned
    expect(body.data.email).not.toBe('john.doe@gmail.com');
  });

  it('masks emails without a TLD dot correctly (no trailing dot)', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'localuser',
      email: 'admin@localhost',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const res = await GET(makeRequest('GET', undefined, 'user=localuser'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.email).toBe('ad***@lo***');
    // Must not have a trailing dot
    expect(body.data.email.endsWith('.')).toBe(false);
  });
});

describe('DELETE /api/notify', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.check).mockResolvedValue(true);
    vi.mocked(verifyGitHubOwner).mockResolvedValue({ verified: true });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects username-only deletion without a management token or matching GitHub owner', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'victim',
      email: 'victim@example.com',
      managementTokenHash: hashNotificationManagementToken('real-management-token'),
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 401,
      message: 'GitHub authentication is required.',
    });

    const res = await DELETE(makeRequest('DELETE', undefined, 'user=victim'));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.message).toContain('management token');
    expect(Notification.deleteOne).not.toHaveBeenCalled();
  });

  it('deletes preferences when a valid management token is supplied', async () => {
    const managementToken = 'delete-management-token';
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
      managementTokenHash: hashNotificationManagementToken(managementToken),
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
    vi.mocked(Notification.deleteOne).mockResolvedValue({ deletedCount: 1 } as never);

    const res = await DELETE(
      makeRequest('DELETE', undefined, `user=testuser&managementToken=${managementToken}`)
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Notification.deleteOne).toHaveBeenCalledWith({ username: 'testuser' });
    expect(verifyGitHubOwner).not.toHaveBeenCalled();
  });
});
