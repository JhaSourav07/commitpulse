import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/github', () => ({
  isAbortError: vi.fn((error: unknown) => {
    return error instanceof Error && error.name === 'AbortError';
  }),
}));

import { GET } from './route';
import { fetchPRInsights } from '@/services/github/pr-insights';
import type { PRInsightData } from '@/services/github/pr-insights';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { RateLimiter } from '@/lib/rate-limit';

const makeRequest = (username = 'octocat') =>
  new Request(`http://localhost:3000/api/pr-insights?username=${username}`);

describe('GET /api/pr-insights - Error Resilience', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    vi.mocked(getUserGitHubToken).mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('1. handles database/network connectivity errors gracefully without crashing, returning 500 status (Hydration Stability)', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue(
      new Error('Connection timed out to database instance')
    );

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Connection timed out to database instance',
    });
  });

  it('2. recovers gracefully and returns a 500 status when internal properties throw a nested runtime exception (Exception Safety & Fallbacks)', async () => {
    vi.mocked(fetchPRInsights).mockImplementation((): Promise<PRInsightData> => {
      throw new TypeError("Cannot read properties of undefined (reading 'prs')");
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('Cannot read properties of undefined');
  });

  it('3. verifies that exceptions are logged to the console/dev-telemetry tracker appropriately (Telemetry Tracking)', async () => {
    const errorMsg = 'Unexpected database node failure';
    vi.mocked(fetchPRInsights).mockRejectedValue(new Error(errorMsg));

    await GET(makeRequest());

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching PR insights:', expect.any(Error));
  });

  it('4. ensures user reset and reload paths/headers are available on rate limit recovery panels (Interactive Recovery UI)', async () => {
    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123456789,
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(429);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789');

    const body = await response.json();
    expect(body.error).toBe('Too many requests. Please try again later.');
  });

  it('5. returns a properly sanitized and structured error message when validation or abort exception occurs to maintain client-side stability (Hydration Safety)', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    vi.mocked(fetchPRInsights).mockRejectedValue(abortError);

    const response = await GET(makeRequest());
    expect(response.status).toBe(504);

    const body = await response.json();
    expect(body).toEqual({
      error: 'Upstream request timed out after 10 seconds.',
    });
  });
});
