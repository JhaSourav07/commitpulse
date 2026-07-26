import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/github', () => ({
  getGitHubTokens: vi.fn(() => ['test-token']),
  fetchWithRetry: vi.fn(async (url: string) => {
    if (url.includes('/users/') && url.includes('/repos?')) {
      return new Response(
        JSON.stringify(
          Array.from({ length: 20 }, (_, index) => ({
            name: `repo-${index}`,
            owner: { login: 'octocat' },
            fork: false,
          }))
        ),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify(url.includes('/runs') ? { workflow_runs: [] } : { workflows: [] }),
      {
        status: 200,
      }
    );
  }),
}));

import { fetchWithRetry } from '@/lib/github';
import { fetchCIAnalytics } from './ci-analytics';

describe('CI analytics request fan-out budget', () => {
  it('caps workflow fetch targets even when a user has many repositories', async () => {
    await fetchCIAnalytics(`security-budget-${Date.now()}`);

    const actionCalls = vi
      .mocked(fetchWithRetry)
      .mock.calls.filter(([url]) => String(url).includes('/actions/'));

    expect(actionCalls).toHaveLength(10);
  });
});
