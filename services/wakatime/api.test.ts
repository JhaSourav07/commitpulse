// services/wakatime/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWakaTimeStats, isWakaTimeConfigured } from './api';

describe('WakaTime API Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('isWakaTimeConfigured', () => {
    it('returns false when WAKATIME_API_KEY is not set', () => {
      delete process.env.WAKATIME_API_KEY;
      expect(isWakaTimeConfigured()).toBe(false);
    });

    it('returns true when WAKATIME_API_KEY is set', () => {
      process.env.WAKATIME_API_KEY = 'test_key';
      expect(isWakaTimeConfigured()).toBe(true);
    });
  });

  describe('getWakaTimeStats', () => {
    it('returns isConfigured: false if env var is missing', async () => {
      delete process.env.WAKATIME_API_KEY;
      const result = await getWakaTimeStats();
      expect(result.isConfigured).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns valid data on successful fetch', async () => {
      process.env.WAKATIME_API_KEY = 'test_key';

      const mockData = {
        data: {
          total_seconds: 36000,
          daily_average: 7200,
          human_readable_total: '10 hrs',
          human_readable_daily_average: '2 hrs',
          languages: [
            { name: 'TypeScript', percent: 60, total_seconds: 21600, text: '6 hrs' },
            { name: 'JavaScript', percent: 40, total_seconds: 14400, text: '4 hrs' },
          ],
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as unknown as Response);

      const result = await getWakaTimeStats();

      expect(result.isConfigured).toBe(true);
      expect(result.totalSeconds).toBe(36000);
      expect(result.humanReadableTotal).toBe('10 hrs');
      expect(result.languages).toHaveLength(2);
      expect(result.languages?.[0].name).toBe('TypeScript');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://wakatime.com/api/v1/users/current/stats/last_7_days',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from('test_key').toString('base64')}`,
          }),
        })
      );
    });

    it('handles non-ok responses gracefully', async () => {
      process.env.WAKATIME_API_KEY = 'test_key';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as unknown as Response);

      const result = await getWakaTimeStats();

      expect(result.isConfigured).toBe(true);
      expect(result.totalSeconds).toBeUndefined();
    });

    it('handles fetch errors gracefully', async () => {
      process.env.WAKATIME_API_KEY = 'test_key';

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await getWakaTimeStats();

      expect(result.isConfigured).toBe(true);
      expect(result.totalSeconds).toBeUndefined();
    });
  });
});
