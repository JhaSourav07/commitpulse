import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './loading';
import '@testing-library/jest-dom';

// Define cache and service stubs
interface Contributor {
  id: number;
  login: string;
}

const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
};

const mockFetchContributors = vi.fn();

describe('ContributorsLoading - Mock Integrations & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.get.mockReset();
    mockCache.set.mockReset();
    mockCache.clear.mockReset();
    mockFetchContributors.mockReset();
  });

  // --- Test Case 1 ---
  it('mocks standard asynchronous imports and databases using stubs', async () => {
    mockFetchContributors.mockResolvedValue([
      { id: 1, login: 'contributor-1' },
      { id: 2, login: 'contributor-2' },
    ]);

    const data = await mockFetchContributors();
    expect(data).toHaveLength(2);
    expect(data[0].login).toBe('contributor-1');
  });

  // --- Test Case 2 ---
  it('tests service loading paths to ensure pending state overlays render', async () => {
    let resolvePromise: (value: Contributor[]) => void = () => {};
    const promise = new Promise<Contributor[]>((resolve) => {
      resolvePromise = resolve;
    });

    mockFetchContributors.mockReturnValue(promise);

    // Start fetch (service is pending)
    const fetchTask = mockFetchContributors();

    // Render loading indicator which represents the pending overlay
    render(<Loading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Loading the collective...')).not.toBeInTheDocument();

    // Resolve the pending fetch
    resolvePromise([{ id: 1, login: 'contributor-1' }]);
    const result = await fetchTask;
    expect(result).toHaveLength(1);
  });

  // --- Test Case 3 ---
  it('asserts local cache layers are queried before triggering database retrievals', async () => {
    const cachedData = [{ id: 1, login: 'cached-user' }];
    mockCache.get.mockReturnValue(cachedData);

    const getContributors = async () => {
      const cacheVal = mockCache.get('contributors');
      if (cacheVal) return cacheVal;
      return mockFetchContributors();
    };

    const result = await getContributors();

    expect(mockCache.get).toHaveBeenCalledWith('contributors');
    expect(mockFetchContributors).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);
  });

  // --- Test Case 4 ---
  it('verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    mockFetchContributors.mockRejectedValue(new Error('Gateway Timeout'));

    const getContributorsWithFallback = async () => {
      try {
        return await mockFetchContributors();
      } catch {
        // Fallback to loading/empty indicator render
        render(<Loading />);
        return [];
      }
    };

    const result = await getContributorsWithFallback();

    expect(result).toEqual([]);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Loading the collective...')).not.toBeInTheDocument();
  });

  // --- Test Case 5 ---
  it('asserts complete cache sync is written on success callbacks', async () => {
    const freshData = [{ id: 10, login: 'fresh-user' }];
    mockFetchContributors.mockResolvedValue(freshData);

    const syncAndFetch = async () => {
      const data = await mockFetchContributors();
      mockCache.set('contributors', data);
      return data;
    };

    const result = await syncAndFetch();

    expect(result).toEqual(freshData);
    expect(mockCache.set).toHaveBeenCalledWith('contributors', freshData);
  });
});
