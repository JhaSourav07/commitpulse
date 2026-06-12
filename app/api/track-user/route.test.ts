import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { User } from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { trackUserRateLimiter } from '@/lib/rate-limit';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn((result) => ({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  })),
  trackUserRateLimiter: {
    check: vi.fn().mockResolvedValue(true),
    checkWithResult: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    }),
  },
}));

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn(),
  },
}));

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn().mockImplementation((username) => {
    const lower = username.toLowerCase();
    if (lower === 'octocat' || lower === 'torvalds' || lower === 'valid-user') {
      return Promise.resolve({ login: username });
    }
    return Promise.reject(new Error('User not found'));
  }),
}));

import { fetchUserProfile } from '@/lib/github';
import { trackUserProtection } from '@/services/security/track-user-protection';
import { gitHubUserValidator } from '@/services/github/validate-user';

function makeRequest(body: Record<string, unknown>, headers?: HeadersInit): Request {
  return new Request('http://localhost/api/track-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/track-user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    trackUserProtection.reset();
    gitHubUserValidator.reset();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.MONGODB_URI;
  });

  describe('Abuse Protection & Validation (Issue #1980)', () => {
    // Scenario 1: Valid GitHub username (Stored)
    it('Scenario 1: allows and stores a valid GitHub username', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const response = await POST(makeRequest({ username: 'valid-user' }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(User.updateOne).toHaveBeenCalledWith({ username: 'valid-user' }, expect.any(Object), {
        upsert: true,
      });
    });

    // Scenario 2: Invalid username (Rejected)
    it('Scenario 2: rejects invalid GitHub username that does not exist', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const response = await POST(makeRequest({ username: 'non-existent-user-12345' }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid GitHub username');
      expect(User.updateOne).not.toHaveBeenCalled();
    });

    // Scenario 3: Random UUID (Rejected)
    it('Scenario 3: rejects random UUID format immediately at regex format stage', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const response = await POST(makeRequest({ username: 'invalid--username!123' }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid GitHub username');
      expect(fetchUserProfile).not.toHaveBeenCalled(); // Blocked before API lookup!
      expect(User.updateOne).not.toHaveBeenCalled(); // Blocked before DB write!
    });

    // Scenario 4: Duplicate tracking request (cooldown deduplication)
    it('Scenario 4: skips database write for duplicate tracking request within cooldown', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      // First tracking allowed
      const firstResponse = await POST(makeRequest({ username: 'valid-user' }));
      expect(firstResponse.status).toBe(200);
      expect(User.updateOne).toHaveBeenCalledTimes(1);

      // Second tracking within cooldown
      const secondResponse = await POST(makeRequest({ username: 'valid-user' }));
      expect(secondResponse.status).toBe(200);
      const data = await secondResponse.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('User already tracked recently');
      expect(User.updateOne).toHaveBeenCalledTimes(1); // Not incremented!
    });
  });

  describe('Validation Basic Checks', () => {
    it('returns 400 for malformed JSON request bodies', async () => {
      const malformedRequest = {
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        headers: new Headers(),
      } as unknown as Request;

      const response = await POST(malformedRequest);

      expect(response.status).toBe(400);

      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Malformed JSON request body');
    });

    it('returns 400 when username is missing', async () => {
      const response = await POST(makeRequest({}));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or missing username');
    });

    it('returns 400 when username is not a string', async () => {
      const response = await POST(makeRequest({ username: 123 }));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('sanitizes and rejects nested MongoDB operators in username field', async () => {
      const response = await POST(makeRequest({ username: { $ne: 'octocat' } }));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or missing username');
    });

    it('sanitizes query injection fields from root payload', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const response = await POST(makeRequest({ username: 'valid-user', $where: 'javascript' }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(User.updateOne).toHaveBeenCalledWith({ username: 'valid-user' }, expect.any(Object), {
        upsert: true,
      });
    });
  });

  it('returns 429 with rate limit headers when rate limited', async () => {
    const reset = Date.now() + 60000;
    vi.mocked(trackUserRateLimiter.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset,
    });

    const response = await POST(
      makeRequest({ username: 'valid-user' }, { 'x-real-ip': '198.51.100.10' })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('x-ratelimit-limit')).toBe('5');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(response.headers.get('x-ratelimit-reset')).toBe(reset.toString());
  });

  it('applies rate limiting to localhost requests', async () => {
    await POST(makeRequest({ username: 'valid-user' }));

    expect(trackUserRateLimiter.checkWithResult).toHaveBeenCalledWith('127.0.0.1');
  });

  describe('Without MONGODB_URI (Local Development Bypass)', () => {
    it('returns 200 and bypassed flag when MONGODB_URI is undefined', async () => {
      delete process.env.MONGODB_URI;

      // Spy on console.warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const response = await POST(makeRequest({ username: 'octocat' }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.bypassed).toBe(true);

      expect(consoleSpy).toHaveBeenCalledWith(
        'MONGODB_URI is not set. Bypassing user tracking for local development.'
      );
      expect(dbConnect).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('With MONGODB_URI', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('connects to DB and upserts the user', async () => {
      const response = await POST(makeRequest({ username: ' OctoCat ' }));

      expect(dbConnect).toHaveBeenCalled();

      // Trims and lowercases
      expect(User.updateOne).toHaveBeenCalledWith(
        { username: 'octocat' },
        {
          $setOnInsert: { username: 'octocat' },
          $set: { lastSeen: expect.any(Date) },
          $inc: { visitCount: 1 },
        },
        { upsert: true }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.bypassed).toBeUndefined();
    });

    it('returns 500 when database connection fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(dbConnect).mockRejectedValueOnce(new Error('DB Down'));

      const response = await POST(makeRequest({ username: 'octocat' }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('GitHub Username Validation Regression Tests (#4895)', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      vi.mocked(fetchUserProfile).mockImplementation((username) => {
        return Promise.resolve({ login: username } as unknown as Awaited<
          ReturnType<typeof fetchUserProfile>
        >);
      });
    });

    const validUsernames = ['octocat', 'KRUSHAL2956', 'my-user'];
    const invalidUsernames = ['!!!!!!!!', '--------', 'abc--', '--abc', '<script>', 'user--name'];

    it('Scenario: valid usernames are allowed and write to database', async () => {
      for (const username of validUsernames) {
        vi.clearAllMocks();
        const response = await POST(makeRequest({ username }));
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(User.updateOne).toHaveBeenCalledWith(
          { username: username.trim().toLowerCase() },
          expect.any(Object),
          { upsert: true }
        );
      }
    });

    it('Scenario: invalid usernames return 400 and never perform database operations', async () => {
      for (const username of invalidUsernames) {
        vi.clearAllMocks();
        const response = await POST(makeRequest({ username }));
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid GitHub username');
        expect(dbConnect).not.toHaveBeenCalled();
        expect(User.updateOne).not.toHaveBeenCalled();
      }
    });
  });
});
