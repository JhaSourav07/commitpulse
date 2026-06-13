import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useState, useEffect, type ReactNode, type HTMLAttributes } from 'react';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

/* ====================================================================
   GLOBAL MOCKS: Setup environment for ActivityLandscape component
   ==================================================================== */

// Mock IntersectionObserver for Framer Motion
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock ResizeObserver for chart libraries
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

/* ====================================================================
   SERVICE LAYER MOCKS: Simulated async API and cache functions
   ==================================================================== */

// Mock service for fetching activity data from API
const mockActivityService = {
  fetchActivityData: vi.fn(async (): Promise<ActivityData[]> => {
    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [
      { date: '2026-05-01', count: 3, intensity: 1 },
      { date: '2026-05-02', count: 7, intensity: 2 },
      { date: '2026-05-03', count: 15, intensity: 3 },
      { date: '2026-05-04', count: 22, intensity: 4 },
      { date: '2026-05-05', count: 18, intensity: 3 },
    ];
  }),
};

// Mock cache layer for storing fetched data
const mockCacheLayer = {
  get: vi.fn((key: string) => localStorage.getItem(key)),
  set: vi.fn((key: string, data: ActivityData[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  }),
  clear: vi.fn(() => localStorage.clear()),
};

// Wrapper component simulating data fetching with cache
function ActivityLandscapeWithFetch({ simulateTimeout = false }: { simulateTimeout?: boolean }) {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = 'activity_data_cache';
      setLoading(true);

      // Step 1: Check cache FIRST
      const cachedData = mockCacheLayer.get(cacheKey);
      if (cachedData) {
        setData(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      try {
        // Step 2: If no cache hit, fetch from API
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API Timeout')), simulateTimeout ? 10 : 5000)
        );

        const fetchPromise = mockActivityService.fetchActivityData();
        const result = await Promise.race([fetchPromise, timeoutPromise]);

        // Step 3: Write to cache on success
        mockCacheLayer.set(cacheKey, result);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty state on error
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [simulateTimeout]);

  if (error) {
    return (
      <div data-testid="error-state">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="loading-state">
        <p>Loading activity data...</p>
      </div>
    );
  }

  return data.length > 0 ? (
    <ActivityLandscape data={data} />
  ) : (
    <div data-testid="empty-state">No data available</div>
  );
}

/* ====================================================================
   VITEST TEST SUITE: Mock Integration Tests
   ==================================================================== */

describe('ActivityLandscape: Asynchronous Service Layer Mocking & Cache Behavior', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Clear cache before each test to ensure isolation
    localStorage.clear();
    mockCacheLayer.clear();

    // Reset mock functions
    mockActivityService.fetchActivityData.mockClear();
    mockCacheLayer.get.mockClear();
    mockCacheLayer.set.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /* ========================================================
     TEST 1: Mock all async service calls using vi.fn()
     ======================================================== */
  it('Test 1: should mock all async service calls using vi.fn() and execute without errors', async () => {
    mockActivityService.fetchActivityData.mockResolvedValueOnce([
      { date: '2026-05-01', count: 5, intensity: 2 },
      { date: '2026-05-02', count: 10, intensity: 3 },
    ]);

    const { container } = render(<ActivityLandscapeWithFetch />);

    await waitFor(
      () => {
        expect(mockActivityService.fetchActivityData).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    expect(mockActivityService.fetchActivityData).toHaveBeenCalledTimes(1);
    expect(container).toBeTruthy();
  });

  /* ========================================================
     TEST 2: Cache is checked BEFORE API call (cache hit)
     ======================================================== */
  it('Test 2: should check cache layer BEFORE triggering API call, and use cached data on hit', async () => {
    const cachedActivityData: ActivityData[] = [
      { date: '2026-04-20', count: 8, intensity: 2 },
      { date: '2026-04-21', count: 12, intensity: 3 },
    ];

    // Pre-populate cache
    mockCacheLayer.set('activity_data_cache', cachedActivityData);

    render(<ActivityLandscapeWithFetch />);

    // Verify cache was checked
    expect(mockCacheLayer.get).toHaveBeenCalledWith('activity_data_cache');

    // API should NOT be called when cache hit occurs
    await waitFor(
      () => {
        expect(mockActivityService.fetchActivityData).not.toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // Verify loading completed without fetching
    expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
  });

  /* ========================================================
     TEST 3: Loading state renders while async request pending
     ======================================================== */
  it('Test 3: should render loading state while async request is pending', async () => {
    // Make fetch hang indefinitely
    mockActivityService.fetchActivityData.mockImplementationOnce(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    render(<ActivityLandscapeWithFetch />);

    // Loading state should be visible immediately
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Loading activity data...')).toBeDefined();

    // Verify cache was checked first (not skipped)
    expect(mockCacheLayer.get).toHaveBeenCalled();
  });

  /* ========================================================
     TEST 4: API timeout triggers fallback behavior
     ======================================================== */
  it('Test 4: should handle API timeout and display fallback error state', async () => {
    // Simulate timeout by setting simulateTimeout=true
    render(<ActivityLandscapeWithFetch simulateTimeout={true} />);

    await waitFor(
      () => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify error message is displayed
    expect(screen.getByText(/Error: API Timeout/i)).toBeDefined();

    // Verify cache was attempted first
    expect(mockCacheLayer.get).toHaveBeenCalled();

    // Verify API was called (since cache was empty)
    expect(mockActivityService.fetchActivityData).toHaveBeenCalled();
  });

  /* ========================================================
     TEST 5: Successful response writes to cache layer
     ======================================================== */
  it('Test 5: should verify successful API response writes to cache layer', async () => {
    const mockActivityResponse: ActivityData[] = [
      { date: '2026-05-10', count: 20, intensity: 4 },
      { date: '2026-05-11', count: 25, intensity: 4 },
      { date: '2026-05-12', count: 18, intensity: 3 },
    ];

    mockActivityService.fetchActivityData.mockResolvedValueOnce(mockActivityResponse);

    render(<ActivityLandscapeWithFetch />);

    await waitFor(
      () => {
        expect(mockCacheLayer.set).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Verify cache.set was called with correct key and data
    expect(mockCacheLayer.set).toHaveBeenCalledWith('activity_data_cache', mockActivityResponse);

    // Verify data was cached after successful fetch
    const cachedData = localStorage.getItem('activity_data_cache');
    expect(cachedData).toBeTruthy();
    expect(JSON.parse(cachedData!)).toEqual(mockActivityResponse);

    // Component should render without errors
    expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });
});
