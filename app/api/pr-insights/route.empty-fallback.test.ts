import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { fetchPRInsights } from '@/services/github/pr-insights';
import { RateLimiter } from '@/lib/rate-limit';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

describe('PR Insights Route Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 123456789,
    });

    vi.mocked(fetchPRInsights).mockResolvedValue([] as never);
  });

  it('returns username required when username query parameter is completely missing', async () => {
    const request = new Request('http://localhost/api/pr-insights');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'Username is required',
    });

    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('returns username required when username is provided as an empty string', async () => {
    const request = new Request('http://localhost/api/pr-insights?username=');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'Username is required',
    });

    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('returns invalid username when username contains only whitespace characters', async () => {
    const request = new Request('http://localhost/api/pr-insights?username=%20%20%20%20');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid GitHub username',
    });

    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('returns invalid username when username contains only tabs and newlines', async () => {
    const request = new Request('http://localhost/api/pr-insights?username=%0A%09');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid GitHub username',
    });

    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('trims excessive surrounding whitespace and successfully fetches insights', async () => {
    const request = new Request(
      'http://localhost/api/pr-insights?username=%20%20%20octocat%20%20%20'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(fetchPRInsights).toHaveBeenCalledWith('octocat', undefined, expect.any(AbortSignal));
  });
});
