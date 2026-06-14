import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import dbConnect from '@/lib/mongodb';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Notification', () => ({
  Notification: {
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

import { Notification } from '@/models/Notification';
import { notifyRateLimiter } from '@/lib/rate-limit';

const makeRequest = (search?: string) =>
  new NextRequest(`http://localhost:3000/api/notify${search ? `?${search}` : ''}`, {
    method: 'GET',
    headers: {
      'x-forwarded-for': '127.0.0.1',
    },
  });

describe('Notify Route Accessibility', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    process.env.MONGODB_URI = 'mongodb://localhost/test';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns a human-readable validation message when username is missing so assistive technologies can announce the problem', async () => {
    const response = await GET(makeRequest());

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(typeof body.message).toBe('string');

    expect(body.message).toContain('Username is required');

    expect(body.message).not.toContain('undefined');
    expect(body.message).not.toContain('null');
    expect(body.message.trim().length).toBeGreaterThan(0);
  });

  it('returns valid parseable JSON responses so assistive clients can reliably interpret state', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'john.doe@gmail.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const response = await GET(makeRequest('user=testuser'));

    const text = await response.text();

    expect(() => JSON.parse(text)).not.toThrow();

    const contentType = response.headers.get('content-type') || '';

    expect(contentType.toLowerCase()).toContain('application/json');
    expect(response.status).toBe(200);
  });

  it('communicates rate-limit failures using descriptive plain-language text instead of technical output', async () => {
    const reset = Date.now() + 60000;

    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset,
    });

    const response = await GET(makeRequest('user=testuser'));

    const body = await response.json();

    expect(response.status).toBe(429);
    expect(typeof body.message).toBe('string');

    expect(body.message.toLowerCase()).toContain('too many');
    expect(body.message).not.toMatch(/^\d+$/);
    expect(body.message).not.toContain('undefined');
    expect(body.message.trim().length).toBeGreaterThan(0);
  });

  it('communicates missing notification preferences with readable text that assistive technologies can announce', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null);

    const response = await GET(makeRequest('user=unknown-user'));

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(typeof body.message).toBe('string');

    expect(body.message).toBe('No notification preferences found.');

    expect(body.message).not.toContain('undefined');
    expect(body.message).not.toContain('null');
    expect(body.message).not.toMatch(/at\s+\w+\s+\(/);
  });

  it('produces safe text-only error output that does not inject markup into consuming interfaces', async () => {
    vi.mocked(dbConnect).mockRejectedValueOnce(new Error('Internal database failure'));

    const response = await GET(makeRequest('user=testuser'));

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(typeof body.message).toBe('string');

    expect(body.message).not.toMatch(/<script/i);
    expect(body.message).not.toMatch(/<\/?[a-z][\s\S]*>/i);

    expect(body.message.trim().length).toBeGreaterThan(0);
  });
});
