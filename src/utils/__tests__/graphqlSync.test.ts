import { describe, it, expect, vi, beforeEach } from 'vitest';
// 1. Import the actual function from github.ts using your project alias
import { fetchGitHubContributions } from '@/lib/github';
// 2. Import your mock payload fixture
import successPayload from './fixtures/githubContributionsPayload.json';

describe('GraphQL Syncing Utility Integration Tests', () => {
  beforeEach(() => {
    process.env.GITHUB_PAT = 'mock_token_for_testing';
    process.env.GITHUB_TOKEN = 'mock_token_for_testing';
  });

  // Test Case 1: The Happy Path (Successful Parsing)
  it('should successfully intercept network calls and return mocked contribution data', async () => {
    // Create a mock response block that matches exactly what fetchGraphQLWithRetry expects
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: async () => successPayload,
      // Add the missing clone method to prevent "TypeError: res.clone is not a function"
      clone() {
        return this;
      },
    };

    // Intercept global fetch execution
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchGitHubContributions('attardekhushi78-cpu', { bypassCache: true });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.calendar.totalContributions).toBe(142);
  });
  // Test Case 2: The Error Path (Rate Limit/Network Interception)
  it('should gracefully handle unexpected GitHub API rate limits or network issues', async () => {
    // Force fetch to mock an explicit 403 Forbidden rate limit layout status
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': (Math.floor(Date.now() / 1000) + 60).toString(),
      }),
    });

    // Verifies your utility safely surfaces network errors instead of an unhandled crash
    await expect(
      fetchGitHubContributions('attardekhushi78-cpu', { bypassCache: true })
    ).rejects.toThrow();
  });
});
