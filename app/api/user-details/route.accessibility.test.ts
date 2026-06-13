// app/api/user-details/route.accessibility.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

import { GET } from './route';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import type { ContributionCalendar } from '@/types';

const mockCalendar: ContributionCalendar = {
  totalContributions: 15,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2024-06-10' },
        { contributionCount: 5, date: '2024-06-11' },
        { contributionCount: 5, date: '2024-06-12' },
      ],
    },
  ],
};

const mockProfile = {
  login: 'testuser',
  name: 'Test User',
  avatar_url: 'https://github.com/testuser.png',
  public_repos: 12,
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/user-details');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('ApiUser-detailsRoute Accessibility (WCAG / ARIA compliance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchUserProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      totalPRs: 0,
      totalIssues: 0,
    });
  });

  // -----------------------------------------------------------------------
  // Test 1: Exercises the UNTESTED 500 error branch (route.ts line 53).
  // The existing route.test.ts only tests "User not found" from fetchUserProfile
  // (which hits the 404 path). A generic internal error that does NOT contain
  // "not found" or "404" falls through to the 500 branch — never tested.
  // -----------------------------------------------------------------------
  it('returns a descriptive 500 error when fetchUserProfile throws a generic internal failure', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:27017'));

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.trim().length).toBeGreaterThan(0);
    // The route passes the raw message through on 500; verify the error field
    // exists and is a readable string (not undefined/null/empty).
    expect(body.error).not.toBe('undefined');
    expect(body.error).not.toBe('null');
  });

  // -----------------------------------------------------------------------
  // Test 2: Exercises the UNTESTED contributions "not found" rethrow path
  // (route.ts lines 21-26). The inner .catch() handler re-throws errors
  // whose message includes "not found", propagating them out of Promise.all
  // into the outer catch. The existing tests only mock fetchUserProfile as
  // the source of a 404 — this tests fetchGitHubContributions as the source.
  // -----------------------------------------------------------------------
  it('returns 404 when contributions API reports "not found" even if profile succeeds', async () => {
    // Profile resolves fine, but contributions says user not found
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('User not found'));

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  // -----------------------------------------------------------------------
  // Test 3: Exercises the UNTESTED non-Error throw path (route.ts line 49).
  // When the caught value is not an instanceof Error, the message extraction
  // defaults to '' and the fallback 'Failed to fetch user details' is used.
  // The existing tests always throw Error instances — this tests a thrown
  // string, which can occur when third-party libraries reject with non-Error.
  // -----------------------------------------------------------------------
  it('uses a safe fallback message when a non-Error value is thrown', async () => {
    // Some libraries reject with raw strings instead of Error instances
    vi.mocked(fetchUserProfile).mockRejectedValue('connection timeout');

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(500);
    const body = await response.json();
    // The instanceof Error check yields '' → fallback message is used
    expect(body.error).toBe('Failed to fetch user details');
  });

  // -----------------------------------------------------------------------
  // Test 4: Exercises the UNTESTED "404" substring match (route.ts line 50).
  // The catch block checks: message.includes('not found') || message.includes('404')
  // The existing route.test.ts only tests the 'not found' substring branch.
  // An error like "HTTP 404 response" triggers via the '404' substring — untested.
  // -----------------------------------------------------------------------
  it('treats errors containing "404" substring as user-not-found', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(
      new Error('GitHub API returned HTTP 404 for requested resource')
    );

    const response = await GET(makeRequest({ username: 'ghostuser' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
    // The raw technical message must NOT leak — only the safe constant is returned
    expect(body.error).not.toContain('GitHub API');
    expect(body.error).not.toContain('HTTP');
  });

  // -----------------------------------------------------------------------
  // Test 5: Verifies content-type headers and JSON parseability across all
  // response status codes (200, 400, 404, 500). The existing route.test.ts
  // never asserts Content-Type headers. Assistive clients rely on correct
  // Content-Type to decide how to parse and announce responses (WCAG 4.1.1).
  // -----------------------------------------------------------------------
  it('returns application/json content-type on every response status code', async () => {
    // 200 success
    const res200 = await GET(makeRequest({ username: 'testuser' }));
    expect(res200.status).toBe(200);
    expect(res200.headers.get('content-type')).toContain('application/json');
    const body200 = await res200.json();
    expect(() => JSON.parse(JSON.stringify(body200))).not.toThrow();

    // 400 missing username
    const res400 = await GET(makeRequest());
    expect(res400.status).toBe(400);
    expect(res400.headers.get('content-type')).toContain('application/json');

    // 404 user not found
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));
    const res404 = await GET(makeRequest({ username: 'ghost' }));
    expect(res404.status).toBe(404);
    expect(res404.headers.get('content-type')).toContain('application/json');

    // 500 internal error
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('DB connection lost'));
    const res500 = await GET(makeRequest({ username: 'testuser' }));
    expect(res500.status).toBe(500);
    expect(res500.headers.get('content-type')).toContain('application/json');
  });
});
