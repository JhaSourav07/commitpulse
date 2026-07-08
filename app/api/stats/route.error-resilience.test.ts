import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  contributionsCache: {
    has: vi.fn().mockResolvedValue(false),
  },
  cacheKey: vi.fn().mockReturnValue('test-key'),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Import after mocks
import { GET } from './route';
import { fetchGitHubContributions } from '../../../lib/github';
import logger from '@/lib/logger';

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/stats');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url.toString());
}

describe('GET /api/stats - Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [],
      },
    } as never);
  });

  it('logs unexpected errors and returns 500 instead of crashing', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('Database unavailable'));

    const response = await GET(makeRequest({ user: 'testuser' }));

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Internal server error',
    });

    expect(logger.error).toHaveBeenCalledWith('Unhandled error in /api/stats', {
      error: expect.any(Error),
    });
  });

  it('returns 500 for unexpected runtime exceptions', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('Unexpected runtime failure'));

    const response = await GET(makeRequest({ user: 'testuser' }));

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body.error).toBe('Internal server error');
  });

  it('handles non-Error thrown values safely', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue('something failed');

    const response = await GET(makeRequest({ user: 'testuser' }));

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Internal server error',
    });
  });

  it('returns 404 when GitHub user is not found', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('User not found'));

    const response = await GET(makeRequest({ user: 'missing-user' }));

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toEqual({
      error: 'User not found',
    });
  });

  it('returns 429 when GitHub API rate limit is exceeded', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API Rate Limit Exceeded'));

    const response = await GET(makeRequest({ user: 'testuser' }));

    expect(response.status).toBe(429);

    const body = await response.json();

    expect(body).toEqual({
      error: 'GitHub API rate limit reached. Please try again later.',
    });

    expect(response.headers.get('Retry-After')).toBe('60');
  });
});
