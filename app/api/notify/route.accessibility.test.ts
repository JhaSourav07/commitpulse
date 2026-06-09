// app/api/notify/route.accessibility.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from './route';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/Notification', () => ({
  Notification: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    deleteOne: vi.fn(),
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

describe('Notify Route Accessibility and Resilience', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    vi.mocked(notifyRateLimiter.check).mockResolvedValue(true);
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── 1. Human-Readable Validation Error Messages (WCAG 3.3.1) ───────────────

  describe('Human-Readable Validation Error Messages', () => {
    it('returns human-readable error text for POST validation failures so screen readers can announce the problem', async () => {
      // POST with missing email and username
      const res = await POST(makeRequest('POST', { frequency: 'daily' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(typeof data.message).toBe('string');
      expect(data.message.trim().length).toBeGreaterThan(0);
      // Ensure it does not expose technical or schema details (e.g. ZodError, undefined, null)
      expect(data.message).not.toContain('undefined');
      expect(data.message).not.toContain('null');
      expect(data.message).not.toContain('ZodError');
    });

    it('returns human-readable error text for POST invalid email format', async () => {
      const res = await POST(makeRequest('POST', { username: 'testuser', email: 'invalid-email' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('Invalid email address');
      expect(data.message).not.toContain('undefined');
    });

    it('returns human-readable error text for GET validation failures when username is missing', async () => {
      const res = await GET(makeRequest('GET'));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(typeof data.message).toBe('string');
      expect(data.message.trim().length).toBeGreaterThan(0);
      expect(data.message).not.toContain('undefined');
      expect(data.message).not.toContain('null');
    });

    it('returns human-readable error text for DELETE validation failures when username is invalid', async () => {
      const res = await DELETE(makeRequest('DELETE', undefined, 'user=-baduser'));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(typeof data.message).toBe('string');
      expect(data.message).toContain('Invalid GitHub username');
    });
  });

  // ── 2. Accessible JSON Response Structure (WCAG 4.1.1 Parsing) ─────────────

  describe('Accessible JSON Response Structure', () => {
    it('returns valid parseable JSON with the correct Content-Type header on success (GET)', async () => {
      vi.mocked(Notification.findOne).mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        frequency: 'daily',
        notifyOnCommit: true,
        notifyOnStreak: true,
        notifyOnMilestone: true,
      } as never);

      const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
      expect(res.status).toBe(200);

      // Verify the response is parseable JSON
      const text = await res.text();
      expect(() => JSON.parse(text)).not.toThrow();

      // Verify header matches Content-Type requirements
      const contentType = res.headers.get('content-type') || '';
      expect(contentType.toLowerCase()).toContain('application/json');
    });

    it('returns valid parseable JSON with the correct Content-Type header on validation failure (POST)', async () => {
      const res = await POST(makeRequest('POST', {}));
      expect(res.status).toBe(400);

      const text = await res.text();
      expect(() => JSON.parse(text)).not.toThrow();

      const contentType = res.headers.get('content-type') || '';
      expect(contentType.toLowerCase()).toContain('application/json');
    });
  });

  // ── 3. Rate-Limit Error Responses ──────────────────────────────────────────

  describe('Rate-Limit Error Responses', () => {
    it('communicates POST rate-limiting clearly in readable text and returns 429 status code', async () => {
      vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValueOnce({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const res = await POST(
        makeRequest('POST', { username: 'testuser', email: 'test@example.com' })
      );
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Too many requests');
      // Headers must be set correctly
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('communicates GET rate-limiting clearly and returns 429 status code', async () => {
      vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValueOnce({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.message).toContain('Too many requests');
    });

    it('communicates DELETE rate-limiting clearly and returns 429 status code', async () => {
      vi.mocked(notifyRateLimiter.check).mockResolvedValueOnce(false);

      const res = await DELETE(makeRequest('DELETE', undefined, 'user=testuser'));
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.message).toContain('Too many requests');
    });
  });

  // ── 4. Notification Preference Not Found Responses ─────────────────────────

  describe('Notification Preference Not Found Responses', () => {
    it('returns 404 with plain-language descriptive text when username does not have notification settings (GET)', async () => {
      vi.mocked(Notification.findOne).mockResolvedValue(null);

      const res = await GET(makeRequest('GET', undefined, 'user=nonexistent'));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('No notification preferences found.');
    });

    it('returns 404 with plain-language descriptive text when trying to delete non-existent preferences (DELETE)', async () => {
      vi.mocked(Notification.deleteOne).mockResolvedValue({ deletedCount: 0 } as never);

      const res = await DELETE(makeRequest('DELETE', undefined, 'user=nonexistent'));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('No notification preferences found for this user.');
    });
  });

  // ── 5. Safe Server Error Responses Without Details ─────────────────────────

  describe('Safe Server Error Responses', () => {
    it('returns 500 with generic error message during database write failure (POST)', async () => {
      vi.mocked(Notification.findOneAndUpdate).mockRejectedValueOnce(
        new Error('MongoDB connection failed at localhost:27017. Stack trace: in query() line 92')
      );

      const res = await POST(
        makeRequest('POST', {
          username: 'testuser',
          email: 'test@example.com',
          frequency: 'daily',
        })
      );
      expect(res.status).toBe(500);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error.');

      // Response must not leak database hostname, stack trace lines or connection details
      const stringified = JSON.stringify(data);
      expect(stringified).not.toContain('localhost');
      expect(stringified).not.toContain('27017');
      expect(stringified).not.toContain('Stack trace');
      expect(stringified).not.toContain('mongodb');
    });

    it('returns 500 with generic error message during database fetch failure (GET)', async () => {
      vi.mocked(Notification.findOne).mockRejectedValueOnce(
        new Error('Fatal exception in mongodb client driver index.js')
      );

      const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
      expect(res.status).toBe(500);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error.');

      const stringified = JSON.stringify(data);
      expect(stringified).not.toContain('mongodb');
      expect(stringified).not.toContain('driver');
      expect(stringified).not.toContain('index.js');
    });

    it('returns 500 with generic error message during database deletion failure (DELETE)', async () => {
      vi.mocked(Notification.deleteOne).mockRejectedValueOnce(
        new Error('Unexpected collection lock timeout at collection notification')
      );

      const res = await DELETE(makeRequest('DELETE', undefined, 'user=testuser'));
      expect(res.status).toBe(500);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error.');

      const stringified = JSON.stringify(data);
      expect(stringified).not.toContain('timeout');
      expect(stringified).not.toContain('collection');
      expect(stringified).not.toContain('lock');
    });
  });
});
