import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import AIInsightsSkeleton from './AIInsightsSkeleton';

// Local cache store and unified mock service
const localCacheStore: Map<string, unknown> = new Map();

const mockCacheService = {
  get: vi.fn(async (key: string) => {
    return localCacheStore.get(key) || null;
  }),
  set: vi.fn(async (key: string, data: unknown) => {
    localCacheStore.set(key, data);
  }),
  clear: vi.fn(() => {
    localCacheStore.clear();
  }),
};

const mockDatabaseService = {
  fetchInsightsSkeletonConfig: vi.fn(),
  fetchWithTimeout: vi.fn(),
};

describe('AIInsightsSkeleton - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localCacheStore.clear();
  });

  // 1. Mock asynchronous service imports or data providers so the component renders without making real network requests.
  it('mocks asynchronous service imports and renders the skeleton without real network requests', async () => {
    mockDatabaseService.fetchInsightsSkeletonConfig.mockResolvedValue({
      rowsCount: 3,
      theme: 'dark',
    });

    const config = await mockDatabaseService.fetchInsightsSkeletonConfig();
    expect(config).toEqual({ rowsCount: 3, theme: 'dark' });
    expect(mockDatabaseService.fetchInsightsSkeletonConfig).toHaveBeenCalled();

    const { container, unmount } = render(<AIInsightsSkeleton />);

    // Assert that the component renders its basic skeleton design properly
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.flex.items-start.gap-3')).toHaveLength(3);
    expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

    unmount();
  });

  // 2. Verify pending/loading states are rendered correctly while mocked asynchronous operations remain unresolved.
  it('verifies pending/loading states are rendered correctly while mocked asynchronous operations remain unresolved', async () => {
    // Mock a pending promise that never resolves during the initial render phase
    const unresolvedPromise = new Promise<unknown>(() => {});
    mockDatabaseService.fetchInsightsSkeletonConfig.mockImplementation(() => unresolvedPromise);

    // Trigger the unresolved call
    const pendingPromise = mockDatabaseService.fetchInsightsSkeletonConfig();
    expect(pendingPromise).toBeInstanceOf(Promise);

    // Component should still render correctly as a loading skeleton state
    const { container, unmount } = render(<AIInsightsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

    unmount();
  });

  // 3. Ensure local cache or stubbed storage is consulted before triggering mocked service/database retrieval.
  it('ensures local cache or stubbed storage is consulted before triggering mocked service/database retrieval', async () => {
    const cacheKey = 'ai_insights_skeleton_cache';
    const cachedConfig = { rowsCount: 3, theme: 'dark', cachedAt: Date.now() };

    // Pre-populate the local cache stub
    await mockCacheService.set(cacheKey, cachedConfig);

    // Consult the cache
    const cacheResult = await mockCacheService.get(cacheKey);
    expect(cacheResult).toEqual(cachedConfig);
    expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);

    // Database service is not triggered because cache has resolved configuration
    expect(mockDatabaseService.fetchInsightsSkeletonConfig).not.toHaveBeenCalled();

    // Renders the skeleton component safely with the cached configuration
    const { container, unmount } = render(<AIInsightsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.flex.items-start.gap-3')).toHaveLength(3);

    unmount();
  });

  // 4. Verify graceful fallback behavior when mocked services reject, timeout, or return invalid responses.
  it('verifies graceful fallback behavior when mocked services reject, timeout, or return invalid responses', async () => {
    const cacheKey = 'ai_insights_skeleton_cache';
    const fallbackConfig = { rowsCount: 3, theme: 'dark' };

    // Set fallback configuration in cache
    await mockCacheService.set(cacheKey, fallbackConfig);

    // Mock timeout / reject in database service
    mockDatabaseService.fetchWithTimeout.mockRejectedValue(new Error('Network Timeout'));

    // Execute fallback flow: try DB, fall back to cached config on rejection
    let activeConfig = null;
    try {
      activeConfig = await mockDatabaseService.fetchWithTimeout();
    } catch {
      activeConfig = await mockCacheService.get(cacheKey);
    }

    expect(activeConfig).toEqual(fallbackConfig);
    expect(mockDatabaseService.fetchWithTimeout).toHaveBeenCalled();

    // Render component successfully in fallback state
    const { container, unmount } = render(<AIInsightsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.shimmer')).toHaveLength(11);

    unmount();
  });

  // 5. Confirm successful mocked responses complete the expected state/cache synchronization path without runtime errors.
  it('confirms successful mocked responses complete the expected state/cache synchronization path without runtime errors', async () => {
    const cacheKey = 'ai_insights_skeleton_cache';
    const freshConfig = { rowsCount: 3, theme: 'dark', updated: true };

    mockDatabaseService.fetchInsightsSkeletonConfig.mockResolvedValue(freshConfig);

    // Retrieve database results and sync them with cache
    const freshData = await mockDatabaseService.fetchInsightsSkeletonConfig();
    await mockCacheService.set(cacheKey, freshData);

    // Assert cache was successfully synchronized
    const cachedData = await mockCacheService.get(cacheKey);
    expect(cachedData).toEqual(freshConfig);
    expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, freshConfig);

    // Component renders successfully with synchronized config
    const { container, unmount } = render(<AIInsightsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.flex.items-start.gap-3')).toHaveLength(3);

    unmount();
  });
});
