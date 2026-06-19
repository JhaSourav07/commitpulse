import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { RateLimiter } from '@/lib/rate-limit';
import { fetchCIAnalytics } from '@/services/github/ci-analytics';
import { getClientIp } from '@/utils/getClientIp';

vi.mock('@/services/github/ci-analytics', () => ({
  fetchCIAnalytics: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(),
}));

describe('GET /api/ci-analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');
  });

  it('rejects requests when the endpoint abuse budget is exhausted', async () => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValueOnce(false);

    const response = await GET(new Request('http://localhost/api/ci-analytics?username=octocat'));

    expect(response.status).toBe(429);
    expect(fetchCIAnalytics).not.toHaveBeenCalled();
  });

  it('uses per-IP rate limiting so different IPs get independent buckets', async () => {
    vi.mocked(fetchCIAnalytics).mockResolvedValue({} as never);
    const checkSpy = vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);

    vi.mocked(getClientIp).mockReturnValueOnce('1.2.3.4').mockReturnValueOnce('5.6.7.8');

    await GET(new Request('http://localhost/api/ci-analytics?username=octocat'));
    await GET(new Request('http://localhost/api/ci-analytics?username=octocat'));
    expect(checkSpy).toHaveBeenNthCalledWith(1, '1.2.3.4');
    expect(checkSpy).toHaveBeenNthCalledWith(2, '5.6.7.8');
  });

  it('rejects invalid GitHub usernames before the service fan-out', async () => {
    const response = await GET(
      new Request('http://localhost/api/ci-analytics?username=invalid%20username')
    );

    expect(response.status).toBe(400);
    expect(fetchCIAnalytics).not.toHaveBeenCalled();
  });

  it('fetches analytics for a validated username', async () => {
    vi.mocked(fetchCIAnalytics).mockResolvedValue({ totalRuns: 0 } as never);

    const response = await GET(new Request('http://localhost/api/ci-analytics?username=octocat'));

    expect(response.status).toBe(200);
    expect(fetchCIAnalytics).toHaveBeenCalledWith('octocat', undefined);
  });
});
