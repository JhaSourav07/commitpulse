import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

const mockFetchGitHubContributions = vi.fn();
const mockCacheHas = vi.fn();

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: (...args: unknown[]) => mockFetchGitHubContributions(...args),

  contributionsCache: {
    has: (...args: unknown[]) => mockCacheHas(...args),
  },

  cacheKey: vi.fn(() => 'contributions:testuser'),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

function createRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/stats');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url);
}

const mockCalendar = {
  totalContributions: 20,
  weeks: [
    {
      contributionDays: [
        {
          date: '2026-01-01',
          contributionCount: 5,
        },
      ],
    },
  ],
};

describe('GET /api/stats - Mock Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCacheHas.mockResolvedValue(false);

    mockFetchGitHubContributions.mockResolvedValue({
      calendar: mockCalendar,
    });
  });

  it('mocks async GitHub service without real network calls', async () => {
    const response = await GET(
      createRequest({
        user: 'testuser',
      })
    );

    expect(response.status).toBe(200);

    expect(mockFetchGitHubContributions).toHaveBeenCalledTimes(1);
  });

  it('checks local cache before fetching remote GitHub data', async () => {
    await GET(
      createRequest({
        user: 'testuser',
      })
    );

    expect(mockCacheHas).toHaveBeenCalledWith('contributions:testuser');

    expect(mockCacheHas.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchGitHubContributions.mock.invocationCallOrder[0]
    );
  });

  it('returns calculated stats after successful async service response', async () => {
    const response = await GET(
      createRequest({
        user: 'testuser',
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toHaveProperty('totalContributions');

    expect(body).toHaveProperty('longestStreak');

    expect(body).toHaveProperty('currentStreak');
  });

  it('handles async service timeout failures safely', async () => {
    mockFetchGitHubContributions.mockRejectedValue(new Error('Request timeout'));

    const response = await GET(
      createRequest({
        user: 'testuser',
      })
    );

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Internal server error',
    });
  });

  it('supports cache hit flow without breaking response generation', async () => {
    mockCacheHas.mockResolvedValue(true);

    const response = await GET(
      createRequest({
        user: 'testuser',
      })
    );

    expect(response.status).toBe(200);

    expect(mockFetchGitHubContributions).toHaveBeenCalledWith(
      'testuser',
      expect.objectContaining({
        bypassCache: false,
      })
    );

    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
