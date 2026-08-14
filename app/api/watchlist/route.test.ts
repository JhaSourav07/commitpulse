import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, DELETE } from './route';
import { cacheWarmer } from '@/lib/cacheWarmer/scheduler';

vi.mock('@/lib/cacheWarmer/scheduler', () => ({
  cacheWarmer: {
    warmCache: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Watchlist API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/watchlist', () => {
    it('returns 400 when username is missing', async () => {
      const req = new Request('http://localhost/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('returns 201 and warms cache when valid username is provided', async () => {
      const req = new Request('http://localhost/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '  OctoCat  ' }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.username).toBe('octocat');
      expect(cacheWarmer.warmCache).toHaveBeenCalledWith('octocat');
    });
  });

  describe('GET /api/watchlist', () => {
    it('returns watchlist list', async () => {
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.watchlist)).toBe(true);
    });
  });

  describe('DELETE /api/watchlist', () => {
    it('returns 400 when username is missing', async () => {
      const req = new Request('http://localhost/api/watchlist', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('deletes user successfully', async () => {
      const req = new Request('http://localhost/api/watchlist?username=octocat', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
