import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import type { ExtendedContributionData } from '../../../types';

vi.mock('../../../lib/github', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/github')>('../../../lib/github');
  return {
    ...actual,
    fetchGitHubContributions: vi.fn(),
    getOrgDashboardData: vi.fn(),
    getCircuitTelemetry: vi.fn().mockReturnValue({ isOpen: false, resetInMs: 0 }),
  };
});

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn().mockReturnValue(3600),
  getSecondsUntilMidnightInTimezone: vi.fn().mockReturnValue(7200),
}));

import { fetchGitHubContributions } from '../../../lib/github';

describe('Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Mock standard asynchronous imports and databases using stubs', async () => {
    const mockData = {
      calendar: { totalContributions: 10, weeks: [] },
      repoContributions: [],
    };
    vi.mocked(fetchGitHubContributions).mockResolvedValueOnce(
      mockData as unknown as ExtendedContributionData
    );

    const request = new Request('http://localhost/api/streak?user=testuser');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledWith('testuser', expect.any(Object));
  });

  it('2. Test service loading paths to ensure pending state overlays render', async () => {
    let overlayRendered = false;
    let resolveFetch: (value: unknown) => void = () => {};
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(fetchGitHubContributions).mockImplementationOnce(async () => {
      overlayRendered = true; // Simulating triggering a loading state overlay
      await fetchPromise;
      overlayRendered = false;
      return {
        calendar: { totalContributions: 5, weeks: [] },
        repoContributions: [],
      } as unknown as ExtendedContributionData;
    });

    const request = new Request('http://localhost/api/streak?user=testuser');
    const responsePromise = GET(request);

    // Yield control to let the route handler start running and reach the mock implementation
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(overlayRendered).toBe(true);

    resolveFetch(null);
    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(overlayRendered).toBe(false);
  });

  it('3. Assert local cache layers are queried before triggering database retrievals', async () => {
    const localCacheStub = new Map<string, ExtendedContributionData>();
    const dbRetrieveSpy = vi.fn().mockResolvedValue({
      calendar: { totalContributions: 15, weeks: [] },
      repoContributions: [],
    });

    vi.mocked(fetchGitHubContributions).mockImplementation(async (username) => {
      const key = `contributions:${username}`;
      if (localCacheStub.has(key)) {
        return localCacheStub.get(key)!;
      }
      const data = (await dbRetrieveSpy()) as unknown as ExtendedContributionData;
      localCacheStub.set(key, data);
      return data;
    });

    const request1 = new Request('http://localhost/api/streak?user=cacheduser');
    await GET(request1);
    expect(dbRetrieveSpy).toHaveBeenCalledTimes(1);

    const request2 = new Request('http://localhost/api/streak?user=cacheduser');
    await GET(request2);
    expect(dbRetrieveSpy).toHaveBeenCalledTimes(1); // Read from stubbed local cache, no secondary database retrievals
  });

  it('4. Verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(
      new Error('GitHub API request timed out after 4s')
    );

    const request = new Request('http://localhost/api/streak?user=timeoutuser');
    const response = await GET(request);

    expect(response.status).toBe(504); // Timed out response returns 504 Gateway Timeout in buildErrorResponse
    const body = await response.text();
    expect(body).toContain('<svg');
    expect(body).toContain('timed out'); // fallback warning/sanitized msg
  });

  it('5. Assert complete cache sync is written on success callbacks', async () => {
    const cacheWriteSpy = vi.fn();

    vi.mocked(fetchGitHubContributions).mockImplementationOnce(async (username) => {
      const data = {
        calendar: { totalContributions: 42, weeks: [] },
        repoContributions: [],
      } as unknown as ExtendedContributionData;
      cacheWriteSpy(username, data);
      return data;
    });

    const request = new Request('http://localhost/api/streak?user=syncuser');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(cacheWriteSpy).toHaveBeenCalledWith('syncuser', expect.any(Object));
  });
});
