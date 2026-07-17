import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import logger from '@/lib/logger';
import { getRateLimitHeaders, trackUserRateLimiter } from '@/lib/rate-limit';
import { sanitizeMongoPayload } from '@/utils/sanitize';
import { trackUserProtection } from '@/services/security/track-user-protection';
import { validateCSRF } from '@/lib/security/csrf';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({
    'Retry-After': '60',
  })),
  trackUserRateLimiter: {
    checkWithResult: vi.fn(() => ({
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60_000,
    })),
  },
}));

vi.mock('@/utils/sanitize', () => ({
  sanitizeMongoPayload: vi.fn((payload: unknown) => payload),
}));

vi.mock('@/services/security/track-user-protection', () => ({
  trackUserProtection: {
    verifyAndDeduplicate: vi.fn(() => ({ allowed: true })),
    recordWrite: vi.fn(),
  },
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCSRF: vi.fn(() => null),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

const allowedOrigin = 'https://commitpulse.vercel.app';
const testMongoUri = 'mongodb://localhost:27017/test';

function makeRequest(body: string, contentType: string = 'application/json'): Request {
  return new Request('http://localhost/api/track-user', {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Origin: allowedOrigin,
    },
    body,
  });
}

function makeJsonRequest(body: unknown): Request {
  return makeRequest(JSON.stringify(body));
}

describe('app/api/track-user/route - error resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = testMongoUri;
    vi.mocked(validateCSRF).mockReturnValue(null);
    vi.mocked(sanitizeMongoPayload).mockImplementation((payload: unknown) => payload);
    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockResolvedValue({ allowed: true });
    vi.mocked(trackUserProtection.recordWrite).mockImplementation(() => undefined);
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60_000,
    });
    vi.mocked(getRateLimitHeaders).mockReturnValue({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '5',
      'X-RateLimit-Reset': (Date.now() + 60_000).toString(),
      'Retry-After': '60',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.MONGODB_URI;
  });

  it('returns a structured fallback when the database operation times out', async () => {
    vi.useFakeTimers();
    vi.mocked(dbConnect).mockImplementation(() => new Promise<never>(() => undefined));

    const responsePromise = POST(makeJsonRequest({ username: 'octocat' }));
    await vi.advanceTimersByTimeAsync(1500);
    const response = await responsePromise;
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(User.updateOne).not.toHaveBeenCalled();
    expect(trackUserProtection.recordWrite).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('falls back cleanly for malformed JSON and missing payload structures', async () => {
    const malformedResponse = await POST(makeRequest('not-json'));
    const malformedPayload = await malformedResponse.json();

    const missingResponse = await POST(makeJsonRequest({ metadata: { source: 'client' } }));
    const missingPayload = await missingResponse.json();

    expect(malformedResponse.status).toBe(400);
    expect(malformedPayload.success).toBe(false);
    expect(malformedPayload.error).toBe('Malformed JSON request body');

    expect(missingResponse.status).toBe(400);
    expect(missingPayload.success).toBe(false);
    expect(missingPayload.error).toBe('Invalid or missing username');
  });

  it('dispatches sub-utility failures to the internal logger and returns a 500 fallback', async () => {
    vi.mocked(trackUserProtection.verifyAndDeduplicate).mockRejectedValueOnce(
      new Error('verification pipeline failed')
    );

    const response = await POST(makeJsonRequest({ username: 'octocat' }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to track user',
      expect.objectContaining({
        route: '/api/track-user',
        error: expect.any(Error),
      })
    );
  });

  it('survives a mid-stream database write failure without hard-crashing the endpoint', async () => {
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof dbConnect>>);
    vi.mocked(User.updateOne).mockRejectedValueOnce(new Error('write interruption'));

    const response = await POST(makeJsonRequest({ username: 'octocat' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(trackUserProtection.recordWrite).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('exposes recovery-oriented retry metadata when the request is rate limited', async () => {
    const reset = Date.now() + 60_000;
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset,
    });
    vi.mocked(getRateLimitHeaders).mockReturnValue({
      'Retry-After': '60',
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': reset.toString(),
    });

    const response = await POST(makeJsonRequest({ username: 'octocat' }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Too many requests, please try again later.');
    expect(response.headers.get('x-ratelimit-limit')).toBe('5');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(response.headers.get('x-ratelimit-reset')).toBe(reset.toString());
  });
});
