import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { User } from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { invalidateUserCache } from '@/lib/github';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/lib/github', () => ({
  invalidateUserCache: vi.fn(),
}));

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/user/timezone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/user/timezone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
  });

  describe('Validation', () => {
    it('returns 400 when username is missing', async () => {
      const response = await POST(makeRequest({ timezone: 'America/New_York' }));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or missing username');
    });

    it('returns 400 when timezone is missing', async () => {
      const response = await POST(makeRequest({ username: 'octocat' }));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or missing timezone');
    });

    it('returns 400 when timezone is an invalid IANA timezone', async () => {
      const response = await POST(makeRequest({ username: 'octocat', timezone: 'Invalid/Zone' }));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid IANA timezone string');
    });
  });

  describe('Without MONGODB_URI (Local Development Bypass)', () => {
    it('returns 200 and invalidates cache without querying DB', async () => {
      delete process.env.MONGODB_URI;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const response = await POST(
        makeRequest({ username: 'OctoCat', timezone: 'America/New_York' })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.timezone).toBe('America/New_York');

      expect(consoleSpy).toHaveBeenCalledWith(
        'MONGODB_URI is not set. Simulating timezone update in cache.'
      );
      expect(invalidateUserCache).toHaveBeenCalledWith('octocat');
      expect(dbConnect).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('With MONGODB_URI', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('upserts timezone, invalidates cache if timezone changed', async () => {
      // Old user exists and had "UTC"
      vi.mocked(User.findOne).mockResolvedValueOnce({ username: 'octocat', timezone: 'UTC' });

      const response = await POST(
        makeRequest({ username: 'OctoCat', timezone: 'America/New_York' })
      );

      expect(dbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ username: 'octocat' });
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { username: 'octocat' },
        {
          $set: { timezone: 'America/New_York' },
          $setOnInsert: { username: 'octocat' },
        },
        { upsert: true, new: true }
      );
      expect(invalidateUserCache).toHaveBeenCalledWith('octocat');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('does not invalidate cache if timezone is unchanged', async () => {
      // Old user exists and already had "America/New_York"
      vi.mocked(User.findOne).mockResolvedValueOnce({
        username: 'octocat',
        timezone: 'America/New_York',
      });

      const response = await POST(
        makeRequest({ username: 'OctoCat', timezone: 'America/New_York' })
      );

      expect(dbConnect).toHaveBeenCalled();
      expect(invalidateUserCache).not.toHaveBeenCalled();

      expect(response.status).toBe(200);
    });

    it('returns 500 when database connection or operations fail', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(dbConnect).mockRejectedValueOnce(new Error('DB connection failed'));

      const response = await POST(
        makeRequest({ username: 'octocat', timezone: 'America/New_York' })
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');

      consoleErrorSpy.mockRestore();
    });
  });
});
