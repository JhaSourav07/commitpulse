import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useState, useEffect } from 'react';
import { PopularRepos } from './PopularPinnnedRepos';
import { DistributedCache } from '@/lib/cache';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-icon" className={className} />
  ),
  Star: ({ className }: { className?: string }) => (
    <svg data-testid="star-icon" className={className} />
  ),
}));

// Mock repository data fixtures
const mockPopularRepos = [
  {
    name: 'popular-alpha',
    description: 'Alpha description',
    stargazerCount: 50,
    forkCount: 2,
    url: 'https://github.com/user/popular-alpha',
    primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  },
];

const mockPinnedRepos = [
  {
    name: 'pinned-alpha',
    description: 'Pinned description',
    stargazerCount: 30,
    forkCount: 4,
    url: 'https://github.com/user/pinned-alpha',
    primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
  },
];

const mockStarredRepos = [
  {
    name: 'starred-alpha',
    description: 'Starred description',
    stargazerCount: 99,
    forkCount: 6,
    url: 'https://github.com/user/starred-alpha',
    primaryLanguage: { name: 'Go', color: '#00ADD8' },
  },
];

interface MockRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  url: string;
  primaryLanguage: { name: string; color: string } | null;
}

interface MockRepoData {
  popularRepos: MockRepo[];
  pinnedRepos: MockRepo[];
  starredRepos: MockRepo[];
}

const mockCombinedData: MockRepoData = {
  popularRepos: mockPopularRepos,
  pinnedRepos: mockPinnedRepos,
  starredRepos: mockStarredRepos,
};

// ─── Asynchronous Integration Service Wrapper ────────────────────────────────
const repoCache = new DistributedCache<MockRepoData>(600);

async function fetchAndCacheRepos(username: string, bypassCache = false) {
  const cacheKey = `repos-${username}`;
  if (!bypassCache) {
    const cached = await repoCache.get(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(`/api/github/repos?username=${username}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve repositories from service layer');
  }
  const data = await res.json();
  await repoCache.set(cacheKey, data, 600000);
  return data;
}

function PopularReposIntegrationWrapper({ username }: { username: string }) {
  const [data, setData] = useState<MockRepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAndCacheRepos(username)
      .then((res) => {
        if (!active) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div data-testid="loading-overlay" className="animate-pulse">
        Crunching your repositories...
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-fallback" className="text-red-500">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <PopularRepos
      popularRepos={data.popularRepos}
      pinnedRepos={data.pinnedRepos}
      starredRepos={data.starredRepos}
    />
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('PopularRepos & Services Mock Integrations', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    // Stub GITHUB_TOKEN environment variables
    vi.stubEnv('GITHUB_TOKEN', 'ghp_123456789012345678901234567890123456');
    vi.stubEnv('GITHUB_PAT', 'ghp_123456789012345678901234567890123456');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  // 1. Mock standard asynchronous imports and databases using stubs.
  it('mocks standard database fetches and loads repository card metrics correctly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCombinedData,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PopularReposIntegrationWrapper username="octocat" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).toBeNull();
    });

    expect(screen.getByText('popular-alpha')).toBeInTheDocument();
    expect(screen.getByText('Alpha description')).toBeInTheDocument();
  });

  // 2. Test service loading paths to ensure pending state overlays render.
  it('displays the loading overlay during pending repository service fetches', async () => {
    // Return a promise that does not resolve immediately to keep it in a loading/pending state
    let resolveFetch: (value: MockRepoData | PromiseLike<MockRepoData>) => void;
    const pendingPromise = new Promise<MockRepoData>((resolve) => {
      resolveFetch = resolve;
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => pendingPromise,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PopularReposIntegrationWrapper username="octocat" />);

    expect(screen.getByTestId('loading-overlay')).toHaveTextContent(
      'Crunching your repositories...'
    );

    // Clean up promise
    await act(async () => {
      resolveFetch(mockCombinedData);
    });
  });

  // 3. Assert local cache layers are queried before triggering database retrievals.
  it('queries local L1 cache layer and skips remote fetch on cache hits', async () => {
    const cacheGetSpy = vi
      .spyOn(DistributedCache.prototype, 'get')
      .mockResolvedValue(mockCombinedData);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<PopularReposIntegrationWrapper username="octocat" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).toBeNull();
    });

    expect(cacheGetSpy).toHaveBeenCalledWith('repos-octocat');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('popular-alpha')).toBeInTheDocument();
  });

  // 4. Verify correct fallback procedures during fake endpoint timeout blocks.
  it('verifies correct fallback procedures and displays error overlay on fetch failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(DistributedCache.prototype, 'get').mockResolvedValue(null);

    render(<PopularReposIntegrationWrapper username="octocat" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).toBeNull();
    });

    expect(screen.getByTestId('error-fallback')).toHaveTextContent(
      'Failed to retrieve repositories from service layer'
    );
  });

  // 5. Assert complete cache sync is written on success callbacks.
  it('asserts repository database results are synchronized to local cache on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCombinedData,
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(DistributedCache.prototype, 'get').mockResolvedValue(null);
    const cacheSetSpy = vi.spyOn(DistributedCache.prototype, 'set').mockResolvedValue(undefined);

    render(<PopularReposIntegrationWrapper username="octocat" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).toBeNull();
    });

    expect(cacheSetSpy).toHaveBeenCalledWith('repos-octocat', mockCombinedData, 600000);
  });
});
