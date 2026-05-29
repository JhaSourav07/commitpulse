import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { User } from '@/models/User';
import dbConnect from '@/lib/mongodb';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn(),
  },
}));

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/track-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/track-user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.MONGODB_URI;
  });

  describe('Validation', () => {
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
    it('returns 400 when body is plain text (not JSON)', async () => {
      const req = new Request('http://localhost/api/track-user', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'not json',
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
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
        { $setOnInsert: { username: 'octocat' } },
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

    it('gracefully handles concurrent duplicate key (code 11000) race conditions', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mongoError = new Error('E11000 duplicate key error collection: username') as Error & {
        code?: number;
        keyPattern?: Record<string, number>;
      };
      mongoError.code = 11000;
      mongoError.keyPattern = { username: 1 };
      vi.mocked(User.updateOne).mockRejectedValueOnce(mongoError);

      const response = await POST(makeRequest({ username: 'octocat' }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('rethrows duplicate key (code 11000) error if it is not related to username', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mongoError = new Error(
        'E11000 duplicate key error collection: other_field'
      ) as Error & {
        code?: number;
        keyPattern?: Record<string, number>;
      };
      mongoError.code = 11000;
      mongoError.keyPattern = { other_field: 1 };
      vi.mocked(User.updateOne).mockRejectedValueOnce(mongoError);

      const response = await POST(makeRequest({ username: 'octocat' }));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
