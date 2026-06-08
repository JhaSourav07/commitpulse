/**
 * Pagination Truncation Tests
 *
 * Task 1 — Bug condition exploration: confirm the bug exists on unfixed code, then verify the fix.
 * Task 2 — Preservation property tests: confirm non-truncated users are unaffected.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchUserRepos, clearGitHubApiCacheForTests } from './github';

vi.mock('server-only', () => ({}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepos(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: offset + i,
    name: `repo-${offset + i}`,
    full_name: `user/repo-${offset + i}`,
    description: null,
    stargazers_count: 0,
    forks_count: 0,
    language: null,
    updated_at: '2024-01-01T00:00:00Z',
    created_at: '2020-01-01T00:00:00Z',
    fork: false,
    private: false,
    owner: { login: 'user' },
  }));
}

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  clearGitHubApiCacheForTests();
  process.env.GITHUB_PAT = 'test-token';
  vi.spyOn(global, 'fetch');
});

afterEach(() => {
  clearGitHubApiCacheForTests();
  vi.restoreAllMocks();
  delete process.env.GITHUB_PAT;
});

// ---------------------------------------------------------------------------
// Task 1 — Bug condition: user with > 300 repos (3 full pages)
// ---------------------------------------------------------------------------

describe('Bug condition: fetchUserRepos for user with > 300 repos', () => {
  it('returns isTruncated: true and totalFetched: 300 when all 3 pages are full', async () => {
    // Simulate a user with 450+ repos — all three pages return 100 items each
    const page1 = makeRepos(100, 0);
    const page2 = makeRepos(100, 100);
    const page3 = makeRepos(100, 200);

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(page1)) // page 1
      .mockResolvedValueOnce(mockResponse(page2)) // page 2
      .mockResolvedValueOnce(mockResponse(page3)); // page 3

    const result = await fetchUserRepos('heavy-user', { bypassCache: true });

    // The fix: result must be FetchedRepos, not a plain array
    expect(result).toHaveProperty('repos');
    expect(result).toHaveProperty('isTruncated');
    expect(result).toHaveProperty('totalFetched');

    expect(result.isTruncated).toBe(true);
    expect(result.totalFetched).toBe(300);
    expect(result.repos).toHaveLength(300);
  });

  it('includes truncation metadata in cache so a cache-hit path also surfaces the warning', async () => {
    const page1 = makeRepos(100, 0);
    const page2 = makeRepos(100, 100);
    const page3 = makeRepos(100, 200);

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(page1))
      .mockResolvedValueOnce(mockResponse(page2))
      .mockResolvedValueOnce(mockResponse(page3));

    // First call — populates cache
    await fetchUserRepos('cache-heavy-user');

    // Second call — should hit cache; fetch should NOT be called again
    const cached = await fetchUserRepos('cache-heavy-user');

    expect(fetch).toHaveBeenCalledTimes(3); // only the initial 3 pages, no re-fetch
    expect(cached.isTruncated).toBe(true);
    expect(cached.totalFetched).toBe(300);
    expect(cached.repos).toHaveLength(300);
  });
});

// ---------------------------------------------------------------------------
// Task 2 — Preservation: users with ≤ 299 repos must not be affected
// ---------------------------------------------------------------------------

describe('Preservation: fetchUserRepos for users with ≤ 299 repos', () => {
  it('single page (< 100 repos) — isTruncated: false, correct repo count', async () => {
    const page1 = makeRepos(50);
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(page1));

    const result = await fetchUserRepos('small-user', { bypassCache: true });

    expect(result.isTruncated).toBe(false);
    expect(result.totalFetched).toBe(50);
    expect(result.repos).toHaveLength(50);
  });

  it('two full pages + partial third (175 repos) — isTruncated: false', async () => {
    const page1 = makeRepos(100, 0);
    const page2 = makeRepos(75, 100);

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(page1))
      .mockResolvedValueOnce(mockResponse(page2))
      .mockResolvedValueOnce(mockResponse([])); // page 3 empty

    const result = await fetchUserRepos('medium-user', { bypassCache: true });

    expect(result.isTruncated).toBe(false);
    expect(result.totalFetched).toBe(175);
    expect(result.repos).toHaveLength(175);
  });

  it('exactly 200 repos (2 full pages, page 3 empty) — isTruncated: false', async () => {
    const page1 = makeRepos(100, 0);
    const page2 = makeRepos(100, 100);

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(page1))
      .mockResolvedValueOnce(mockResponse(page2))
      .mockResolvedValueOnce(mockResponse([])); // page 3 empty

    const result = await fetchUserRepos('user-200', { bypassCache: true });

    expect(result.isTruncated).toBe(false);
    expect(result.totalFetched).toBe(200);
    expect(result.repos).toHaveLength(200);
  });

  it('exactly 299 repos (page 3 returns 99) — isTruncated: false', async () => {
    const page1 = makeRepos(100, 0);
    const page2 = makeRepos(100, 100);
    const page3 = makeRepos(99, 200);

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(page1))
      .mockResolvedValueOnce(mockResponse(page2))
      .mockResolvedValueOnce(mockResponse(page3));

    const result = await fetchUserRepos('user-299', { bypassCache: true });

    expect(result.isTruncated).toBe(false);
    expect(result.totalFetched).toBe(299);
    expect(result.repos).toHaveLength(299);
  });

  it('property: for all repo counts 1–99, isTruncated is always false', async () => {
    // Simulate various single-page user sizes — no truncation ever
    const counts = [1, 5, 10, 50, 75, 99];
    for (const count of counts) {
      clearGitHubApiCacheForTests();
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(makeRepos(count)));

      const result = await fetchUserRepos(`user-${count}`, { bypassCache: true });

      expect(result.isTruncated).toBe(false);
      expect(result.repos).toHaveLength(count);
    }
  });

  it('property: for multi-page counts with partial last page, isTruncated is always false', async () => {
    // (page1=100, page2=partial) — last page is partial so never truncated
    const partialSizes = [1, 25, 50, 75, 99];
    for (const partial of partialSizes) {
      clearGitHubApiCacheForTests();
      vi.mocked(fetch)
        .mockResolvedValueOnce(mockResponse(makeRepos(100, 0)))
        .mockResolvedValueOnce(mockResponse(makeRepos(partial, 100)))
        .mockResolvedValueOnce(mockResponse([]));

      const result = await fetchUserRepos(`multi-user-${partial}`, { bypassCache: true });

      expect(result.isTruncated).toBe(false);
      expect(result.repos).toHaveLength(100 + partial);
    }
  });

  it('cache round-trip for non-truncated user preserves isTruncated: false', async () => {
    const page1 = makeRepos(50);
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(page1));

    // Populate cache
    await fetchUserRepos('cache-small-user');

    // Cache hit
    const cached = await fetchUserRepos('cache-small-user');

    expect(fetch).toHaveBeenCalledTimes(1); // no re-fetch
    expect(cached.isTruncated).toBe(false);
    expect(cached.repos).toHaveLength(50);
  });

  it('bypassCache semantics are unaffected — re-fetches and returns correct FetchedRepos shape', async () => {
    const page1 = makeRepos(60);
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(page1))
      .mockResolvedValueOnce(mockResponse(page1)); // second call with bypassCache

    await fetchUserRepos('bypass-user');
    const result = await fetchUserRepos('bypass-user', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.isTruncated).toBe(false);
    expect(result.repos).toHaveLength(60);
  });
});
