import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchPRInsights } from '@/services/github/pr-insights';
import { RateLimiter } from '@/lib/rate-limit';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

describe('pr-insights mouse interactivity contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 123456789,
    });
  });

  it('returns 400 when username is missing', async () => {
    const request = new Request('http://localhost/api/pr-insights');

    const response = await GET(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Username is required',
    });
  });

  it('calls fetchPRInsights with username from search params', async () => {
    vi.mocked(fetchPRInsights).mockResolvedValue([] as never);

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    await GET(request);

    expect(fetchPRInsights).toHaveBeenCalledWith('aanya', undefined, expect.any(AbortSignal));
  });

  it('returns fetched data on success', async () => {
    const mockData = [{ id: 1, title: 'PR 1' }];

    vi.mocked(fetchPRInsights).mockResolvedValue(mockData as never);

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockData);
  });

  it('rejects requests when the endpoint abuse budget is exhausted', async () => {
    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123456789,
    });

    const response = await GET(new Request('http://localhost/api/pr-insights?username=octocat'));

    expect(response.status).toBe(429);
    expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('uses per-IP rate limiting so different IPs get independent buckets', async () => {
    vi.mocked(fetchPRInsights).mockResolvedValue({} as never);
    const checkSpy = vi.spyOn(RateLimiter.prototype, 'checkWithResult');

    await GET(
      new Request('http://localhost/api/pr-insights?username=octocat', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      })
    );
    await GET(
      new Request('http://localhost/api/pr-insights?username=torvalds', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      })
    );

    expect(checkSpy).toHaveBeenNthCalledWith(1, '127.0.0.1');
    expect(checkSpy).toHaveBeenNthCalledWith(2, '127.0.0.1');
  });

  it('returns error message from thrown Error', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue(new Error('Service failed'));

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Service failed',
    });
  });

  it('returns fallback error message for unknown thrown values', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue('unknown');

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Failed to fetch PR insights',
    });
  });
});
