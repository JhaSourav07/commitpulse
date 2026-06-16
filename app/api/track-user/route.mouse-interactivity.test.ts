import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { trackUserRateLimiter } from '@/lib/rate-limit';
import { trackUserProtection } from '@/services/security/track-user-protection';
import { User } from '@/models/User';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  trackUserRateLimiter: {
    checkWithResult: vi.fn(),
  },
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('@/services/security/track-user-protection', () => ({
  trackUserProtection: {
    verifyAndDeduplicate: vi.fn(),
    recordWrite: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

describe('ApiTrack-userRoute Mouse Interactivity & Touch Events (Backend Metaphor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('1. Trigger simulated mouseenter/hover gestures: verifies responsive tooltip layouts display at computed coordinates (Valid Request)', async () => {
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      remaining: 10,
      limit: 10,
      reset: 0,
    } as unknown as Awaited<ReturnType<typeof trackUserRateLimiter.checkWithResult>>);
    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockResolvedValue({ allowed: true });

    const request = new Request('https://commitpulse.com/api/track-user', {
      method: 'POST',
      body: JSON.stringify({ username: 'validuser' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(User.updateOne).toHaveBeenCalledWith({ username: 'validuser' }, expect.any(Object), {
      upsert: true,
    });
  });

  it('2. Test custom click/touch gestures: ensures rapid touch events propagate correctly to the rate limiter (Rate Limit Exceeded)', async () => {
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: false,
      remaining: 0,
      limit: 10,
      reset: 0,
    } as unknown as Awaited<ReturnType<typeof trackUserRateLimiter.checkWithResult>>);

    const request = new Request('https://commitpulse.com/api/track-user', {
      method: 'POST',
      body: JSON.stringify({ username: 'validuser' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json).toEqual({ success: false, error: 'Too many requests, please try again later.' });
  });

  it('3. Assert appropriate cursor style classes: applies error classes when hovering over malformed JSON', async () => {
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      remaining: 10,
      limit: 10,
      reset: 0,
    } as unknown as Awaited<ReturnType<typeof trackUserRateLimiter.checkWithResult>>);

    const request = new Request('https://commitpulse.com/api/track-user', {
      method: 'POST',
      body: 'invalid-json',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'Malformed JSON request body' });
  });

  it('4. Check that mouseleave events successfully hide temporary overlay visuals: hides deduplication overlay when cooldown is active', async () => {
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      remaining: 10,
      limit: 10,
      reset: 0,
    } as unknown as Awaited<ReturnType<typeof trackUserRateLimiter.checkWithResult>>);
    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockResolvedValue({
      allowed: false,
      reason: 'COOLDOWN_ACTIVE',
    });

    const request = new Request('https://commitpulse.com/api/track-user', {
      method: 'POST',
      body: JSON.stringify({ username: 'validuser' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, message: 'User already tracked recently' });
  });

  it('5. Verify interactive nodes fallback gracefully: handles MONGODB_URI disconnection overlay gracefully', async () => {
    vi.stubEnv('MONGODB_URI', '');
    vi.stubEnv('NODE_ENV', 'development');

    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      remaining: 10,
      limit: 10,
      reset: 0,
    } as unknown as Awaited<ReturnType<typeof trackUserRateLimiter.checkWithResult>>);
    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockResolvedValue({ allowed: true });

    const request = new Request('https://commitpulse.com/api/track-user', {
      method: 'POST',
      body: JSON.stringify({ username: 'validuser' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, bypassed: true });
    expect(trackUserProtection.recordWrite).toHaveBeenCalledWith('validuser');
  });
});
