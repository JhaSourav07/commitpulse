import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import dbConnect from '@/lib/mongodb';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/Notification', () => ({
  Notification: {
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
vi.mock('@/services/github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn().mockResolvedValue(true),
  },
}));

import { Notification } from '@/models/Notification';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { gitHubUserValidator } from '@/services/github/validate-user';

const makeRequest = (method: string, body?: object, search?: string) => {
  const url = `http://localhost:3000/api/notify${search ? '?' + search : ''}`;
  return new NextRequest(url, {
    method,
    headers: { 'x-forwarded-for': '127.0.0.1' },
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
});

describe('GET /api/notify', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.check).mockResolvedValue(true);
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
