import React, { useState, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HistoricalTrendView from './HistoricalTrendView';
import type { ActivityData } from '@/types/dashboard';

// Stub DOM observers missing in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe() {}
  unobserve() {}
  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

const defaultPeriod = { kind: 'year' as const, year: '2023', from: '', to: '', label: '2023' };

// Global cache stub
const globalCache: Record<string, ActivityData[]> = {};

// Mock Database stub
class MockDatabase {
  async fetchActivity(username: string): Promise<ActivityData[]> {
    void username;
    return [];
  }
}

const mockDb = new MockDatabase();

// Async Wrapper to simulate the Service Layer Mocking & Local Cache
function AsyncTrendWrapper({ username }: { username: string }) {
  const [data, setData] = useState<ActivityData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Local cache layer query
      if (globalCache[username]) {
        if (isMounted) {
          setData(globalCache[username]);
          setLoading(false);
        }
        return;
      }

      // Database retrieval
      try {
        const response = await mockDb.fetchActivity(username);
        // Complete cache sync
        globalCache[username] = response;
        if (isMounted) {
          setData(response);
        }
      } catch (e: unknown) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [username]);

  if (loading) return <div data-testid="pending-overlay">Loading Activity Data...</div>;
  if (error) return <div data-testid="fallback-error">{error}</div>;
  if (!data) return null;

  return <HistoricalTrendView username={username} activity={data} period={defaultPeriod} />;
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('HistoricalTrendView - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear cache
    for (const key in globalCache) delete globalCache[key];
    fetchSpy = vi.spyOn(mockDb, 'fetchActivity');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Mock standard asynchronous imports and databases using stubs', async () => {
    const mockData = [{ date: '2023-01-01', count: 5, intensity: 1 as const }];
    fetchSpy.mockResolvedValue(mockData);

    render(<AsyncTrendWrapper username="user1" />);

    await waitFor(() => {
      expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith('user1');
    expect(screen.getByText('2023 · 1 days')).toBeInTheDocument(); // Component rendered correctly
  });

  it('2. Test service loading paths to ensure pending state overlays render', () => {
    // Never resolve to keep loading forever
    fetchSpy.mockImplementation(() => new Promise(() => {}));

    render(<AsyncTrendWrapper username="user2" />);

    // Assert pending state immediately
    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();
    expect(screen.getByText('Loading Activity Data...')).toBeInTheDocument();
  });

  it('3. Assert local cache layers are queried before triggering database retrievals', async () => {
    const cachedData = [{ date: '2023-02-01', count: 10, intensity: 2 as const }];
    globalCache['cachedUser'] = cachedData;

    render(<AsyncTrendWrapper username="cachedUser" />);

    // Wait for the component to settle
    await waitFor(() => {
      expect(screen.getByText('2023 · 1 days')).toBeInTheDocument();
    });

    // Database retrieval should NOT be triggered
    expect(fetchSpy).not.toHaveBeenCalled();
    // Verify it rendered the cached data (active days = 1, streaks = 1)
    expect(screen.getAllByText('1', { selector: 'p.text-3xl' })).toHaveLength(3);
  });

  it('4. Verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    const timeoutError = new Error('Database connection timed out');
    fetchSpy.mockRejectedValue(timeoutError);

    render(<AsyncTrendWrapper username="user-timeout" />);

    // Initially loading
    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();

    // Fallback UI replaces loading overlay
    await waitFor(() => {
      expect(screen.getByTestId('fallback-error')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    expect(screen.getByText('Database connection timed out')).toBeInTheDocument();
  });

  it('5. Assert complete cache sync is written on success callbacks', async () => {
    const freshData = [{ date: '2023-03-01', count: 20, intensity: 3 as const }];
    fetchSpy.mockResolvedValue(freshData);

    // Initial cache is empty
    expect(globalCache['syncUser']).toBeUndefined();

    render(<AsyncTrendWrapper username="syncUser" />);

    await waitFor(() => {
      expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    });

    // Cache sync was written successfully
    expect(globalCache['syncUser']).toEqual(freshData);
  });
});
