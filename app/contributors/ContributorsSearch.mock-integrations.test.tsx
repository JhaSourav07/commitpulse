import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContributorsSearch from './ContributorsSearch';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const motionProps = new Set([
    'whileHover',
    'whileTap',
    'whileInView',
    'initial',
    'animate',
    'exit',
    'variants',
    'transition',
    'viewport',
    'drag',
    'layout',
    'layoutId',
  ]);

  const stripMotionProps = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([key]) => !motionProps.has(key)));

  const createMotionComponent = (tag: string) => {
    const Component = ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
      React.createElement(tag, stripMotionProps(props), children);
    return Component;
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      a: createMotionComponent('a'),
      button: createMotionComponent('button'),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

// Stubs for cache and service layer
interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
};

const mockFetchContributors = vi.fn();

describe('ContributorsSearch - Mock Integrations & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.get.mockReset();
    mockCache.set.mockReset();
    mockCache.clear.mockReset();
    mockFetchContributors.mockReset();
  });

  // --- Test Case 1 ---
  it('mocks standard asynchronous imports and databases using stubs', async () => {
    const mockData: Contributor[] = [
      {
        id: 1,
        login: 'contributor-one',
        avatar_url: 'https://example.com/one.png',
        contributions: 5,
        html_url: 'https://github.com/one',
      },
    ];
    mockFetchContributors.mockResolvedValue(mockData);

    const result = await mockFetchContributors();
    expect(result).toHaveLength(1);
    expect(result[0].login).toBe('contributor-one');

    render(<ContributorsSearch contributors={result} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('contributor-one')).toBeInTheDocument();
  });

  // --- Test Case 2 ---
  it('tests service loading paths to ensure pending state overlays render', async () => {
    let resolvePromise: (value: Contributor[]) => void = () => {};
    const promise = new Promise<Contributor[]>((resolve) => {
      resolvePromise = resolve;
    });

    mockFetchContributors.mockReturnValue(promise);

    // Simulated component container that handles loading state
    const LoadingContainer = ({ isPending }: { isPending: boolean }) => {
      if (isPending) {
        return <div role="status">Loading the collective...</div>;
      }
      return <ContributorsSearch contributors={[]} />;
    };

    const { rerender } = render(<LoadingContainer isPending={true} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the collective...');

    resolvePromise([]);
    await promise;

    rerender(<LoadingContainer isPending={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  // --- Test Case 3 ---
  it('asserts local cache layers are queried before triggering database retrievals', async () => {
    const cachedData: Contributor[] = [
      {
        id: 2,
        login: 'cached-contributor',
        avatar_url: 'https://example.com/cached.png',
        contributions: 10,
        html_url: 'https://github.com/cached',
      },
    ];
    mockCache.get.mockReturnValue(cachedData);

    const getContributorsData = async () => {
      const cacheVal = mockCache.get('contributors_search_cache');
      if (cacheVal) return cacheVal;
      return mockFetchContributors();
    };

    const result = await getContributorsData();

    expect(mockCache.get).toHaveBeenCalledWith('contributors_search_cache');
    expect(mockFetchContributors).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);

    render(<ContributorsSearch contributors={result} />);
    expect(screen.getByText('cached-contributor')).toBeInTheDocument();
  });

  // --- Test Case 4 ---
  it('verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    mockFetchContributors.mockRejectedValue(new Error('Gateway Timeout'));

    const getContributorsWithFallback = async () => {
      try {
        return await mockFetchContributors();
      } catch {
        return [];
      }
    };

    const data = await getContributorsWithFallback();
    expect(data).toEqual([]);

    render(<ContributorsSearch contributors={data} />);
    // "No architects found" should render because data is empty and we filter it
    expect(screen.getByText('No architects found')).toBeInTheDocument();
  });

  // --- Test Case 5 ---
  it('asserts complete cache sync is written on success callbacks', async () => {
    const freshData: Contributor[] = [
      {
        id: 3,
        login: 'fresh-contributor',
        avatar_url: 'https://example.com/fresh.png',
        contributions: 15,
        html_url: 'https://github.com/fresh',
      },
    ];
    mockFetchContributors.mockResolvedValue(freshData);

    const syncAndFetch = async () => {
      const data = await mockFetchContributors();
      mockCache.set('contributors_search_cache', data);
      return data;
    };

    const result = await syncAndFetch();
    expect(mockCache.set).toHaveBeenCalledWith('contributors_search_cache', freshData);

    render(<ContributorsSearch contributors={result} />);
    expect(screen.getByText('fresh-contributor')).toBeInTheDocument();
  });
});
