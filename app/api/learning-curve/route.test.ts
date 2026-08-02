import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import * as githubLib from '@/lib/github';

// Mock the external GitHub fetching library
vi.mock('@/lib/github', () => ({
  fetchGithubUserActivity: vi.fn(),
  transformToRawActivity: vi.fn(),
}));

// Mock the calculation engine so we only test the API route's wiring
vi.mock('@/utils/calculateLearningCurve', () => ({
  calculateLearningCurve: vi.fn((data) => ({
    processed: true,
    activityCount: data.length,
    mockDataPoints: data,
  })),
}));

describe('[Bug fix] /api/learning-curve returns user-specific data, not static mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns different data for two different usernames', async () => {
    // Mock the data returned by fetchGithubUserActivity based on username.
    // We cast via `unknown` to bypass the ESLint `any` rule safely while injecting test tracking properties.
    vi.mocked(githubLib.fetchGithubUserActivity).mockImplementation(async (username) => {
      return { _mockPayloadFor: username } as unknown as githubLib.GitHubUserActivityData;
    });

    // Return uniquely identifiable transformed data for each user
    vi.mocked(githubLib.transformToRawActivity).mockImplementation(
      (data: githubLib.GitHubUserActivityData) => {
        // Cast back to unknown safely to read our injected mock property
        const mockData = data as unknown as { _mockPayloadFor: string };

        if (mockData._mockPayloadFor === 'torvalds') {
          return [{ date: '2023-01-01', language: 'C', commits: 50 }];
        }
        return [{ date: '2023-01-01', language: 'Ruby', commits: 10 }];
      }
    );

    const req1 = new NextRequest('http://localhost/api/learning-curve?username=torvalds');
    const req2 = new NextRequest('http://localhost/api/learning-curve?username=octocat');

    const res1 = await GET(req1);
    const res2 = await GET(req2);

    const json1 = await res1.json();
    const json2 = await res2.json();

    expect(json1.username).toBe('torvalds');
    expect(json2.username).toBe('octocat');

    // The core regression guard: real per-user data should not be byte-identical
    expect(json1.data).not.toEqual(json2.data);

    // Verify integration
    expect(githubLib.fetchGithubUserActivity).toHaveBeenCalledWith('torvalds');
    expect(githubLib.fetchGithubUserActivity).toHaveBeenCalledWith('octocat');
  });

  it('still returns 400 when username is missing', async () => {
    const req = new NextRequest('http://localhost/api/learning-curve');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Username parameter is required');
  });

  it('handles upstream GitHub failures gracefully with a 500', async () => {
    vi.mocked(githubLib.fetchGithubUserActivity).mockRejectedValueOnce(
      new Error('API Rate Limit Exceeded')
    );

    const req = new NextRequest('http://localhost/api/learning-curve?username=errorprone');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.details).toBe('API Rate Limit Exceeded');
  });
});
