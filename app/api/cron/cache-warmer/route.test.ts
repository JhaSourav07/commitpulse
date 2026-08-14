import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { cacheWarmer } from '@/lib/cacheWarmer/scheduler';

vi.mock('@/lib/cacheWarmer/scheduler', () => ({
  cacheWarmer: {
    runWarmupCycle: vi.fn().mockResolvedValue({
      warmedCount: 5,
      durationMs: 120,
      users: ['user1', 'user2', 'user3', 'user4', 'user5'],
    }),
  },
}));

describe('Cache Warmer Cron API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles GET request and executes warmup cycle', async () => {
    const req = new Request('http://localhost/api/cron/cache-warmer?limit=50', {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.warmedCount).toBe(5);
    expect(cacheWarmer.runWarmupCycle).toHaveBeenCalledWith(50);
  });

  it('handles POST request and executes warmup cycle', async () => {
    const req = new Request('http://localhost/api/cron/cache-warmer', {
      method: 'POST',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(cacheWarmer.runWarmupCycle).toHaveBeenCalledWith(100);
  });

  it('returns 500 when warmup cycle throws an error', async () => {
    vi.mocked(cacheWarmer.runWarmupCycle).mockRejectedValueOnce(new Error('API Quota Exceeded'));

    const req = new Request('http://localhost/api/cron/cache-warmer', {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to execute cache warmup cycle');
  });
});
