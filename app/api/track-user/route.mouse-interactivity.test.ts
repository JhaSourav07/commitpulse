import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({ 'X-RateLimit-Remaining': '0' })),
  trackUserRateLimiter: {
    checkWithResult: vi.fn(),
  },
}));

vi.mock('@/services/security/track-user-protection', () => ({
  trackUserProtection: {
    verifyAndDeduplicate: vi.fn(),
    recordWrite: vi.fn(),
  },
}));

import dbConnect from '@/lib/mongodb';
import { trackUserRateLimiter } from '@/lib/rate-limit';
import { User } from '@/models/User';
import { trackUserProtection } from '@/services/security/track-user-protection';
import { getClientIp } from '@/utils/getClientIp';

const createRequest = (body: unknown) =>
  new Request('http://localhost/api/track-user', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });

describe('POST /api/track-user mouse interactivity tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');

    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    } as never);

    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockResolvedValue({
      allowed: true,
    });

    vi.mocked(dbConnect).mockImplementation(() => Promise.resolve({} as never));

    vi.spyOn(User, 'updateOne').mockResolvedValue({} as never);
  });

  it('tracks a valid interactive request and stores the normalized username', async () => {
    const response = await POST(createRequest({ username: ' RiddhimaGupta2 ' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(User.updateOne).toHaveBeenCalledWith(
      { username: 'riddhimagupta2' },
      expect.objectContaining({
        $setOnInsert: { username: 'riddhimagupta2' },
        $inc: { visitCount: 1 },
      }),
      { upsert: true }
    );
    expect(trackUserProtection.recordWrite).toHaveBeenCalledWith('riddhimagupta2');
  });

  it('rejects malformed JSON payloads from invalid interaction events', async () => {
    const request = new Request('http://localhost/api/track-user', {
      method: 'POST',
      body: '{invalid-json',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: 'Malformed JSON request body',
    });
  });

  it('rejects requests without a valid username field', async () => {
    const response = await POST(createRequest({ username: 123 }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: 'Invalid or missing username',
    });
  });

  it('returns fast success when duplicate interaction is still in cooldown', async () => {
    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockResolvedValue({
      allowed: false,
      reason: 'COOLDOWN_ACTIVE',
    });

    const response = await POST(createRequest({ username: 'octocat' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      message: 'User already tracked recently',
    });
    expect(User.updateOne).not.toHaveBeenCalled();
  });

  it('blocks excessive interactive requests using rate limiting', async () => {
    vi.mocked(getClientIp).mockReturnValue('203.0.113.10');
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(createRequest({ username: 'octocat' }));
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json).toEqual({
      success: false,
      error: 'Too many requests, please try again later.',
    });
  });
});
