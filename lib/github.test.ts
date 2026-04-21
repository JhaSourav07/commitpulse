import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGitHubContributions } from './github';
import type { ContributionCalendar } from '../types';

const mockCalendar: ContributionCalendar = {
  totalContributions: 42,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-10' },
        { contributionCount: 0, date: '2024-06-11' },
        { contributionCount: 5, date: '2024-06-12' },
      ],
    },
  ],
};

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchGitHubContributions', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the contribution calendar on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    const result = await fetchGitHubContributions('octocat');

    expect(result).toEqual(mockCalendar);
  });

  it('sends a POST request to the GitHub GraphQL endpoint with the correct body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledOnce();

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(options?.method).toBe('POST');

    // Make sure the username is wired into the GraphQL variables, not hardcoded.
    const body = JSON.parse(options?.body as string);
    expect(body.variables).toEqual({ login: 'octocat' });
    expect(body.query).toContain('contributionCalendar');
  });

  it('works correctly for a brand-new user who has zero contribution weeks', async () => {
    const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: emptyCalendar } },
        },
      })
    );

    const result = await fetchGitHubContributions('new-user');

    expect(result).toEqual(emptyCalendar);
  });

  it('throws with the status code when the server returns 500', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Internal Server Error' }, 500));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub API returned status 500'
    );
  });

  it('throws with the status code when the server returns 401 (expired or missing token)', async () => {
    // A 401 is the most common real-world failure — bad or missing GITHUB_PAT.
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub API returned status 401'
    );
  });

  it('throws when fetch itself rejects due to a network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow('Failed to fetch');
  });

  it('throws the first GraphQL error when the API returns an errors array', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: { user: null },
        errors: [{ message: 'Bad credentials' }, { message: 'Some other error' }],
      })
    );

    // Only the first error surfaces — the source always reads errors[0].
    await expect(fetchGitHubContributions('octocat')).rejects.toThrow('Bad credentials');
  });

  it('throws a descriptive "user not found" error when the username does not exist on GitHub', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ data: { user: null } }));

    await expect(fetchGitHubContributions('ghost-user-xyz')).rejects.toThrow(
      'GitHub user "ghost-user-xyz" not found'
    );
  });
});
