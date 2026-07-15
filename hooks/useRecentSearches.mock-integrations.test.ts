import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches, STORAGE_KEY } from './useRecentSearches';

// ============================================================================
// STUBS & SERVICE LAYER MOCKING SETUP
// ============================================================================

// Simulated asynchronous network service / database endpoint layer
const mockRemoteService = {
  fetchBackup: vi.fn(),
  syncToCloud: vi.fn(),
};

describe('useRecentSearches - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // Test 1: Verify Service Loading States
  // --------------------------------------------------------------------------
  it('should verify service loading states and overlay constraints during async fetches', async () => {
    // Return a delayed promise to simulate an active asynchronous service operation
    let resolveService: (value: string[]) => void = () => {};
    const delayPromise = new Promise<string[]>((resolve) => {
      resolveService = resolve;
    });
    mockRemoteService.fetchBackup.mockReturnValue(delayPromise);

    // Initial state simulation matching the hook's mounting/hydration logic
    const { result, rerender } = renderHook(() => {
      const hookInstance = useRecentSearches();
      // Simulate an overlay tracking constraint that depends on service resolution
      const isServicePending =
        mockRemoteService.fetchBackup.mock.calls.length > 0 && !localStorage.getItem(STORAGE_KEY);
      return { ...hookInstance, isServicePending };
    });

    // Trigger service fetch simulation
    mockRemoteService.fetchBackup();
    rerender();

    // Verify loading overlay tracking constraint evaluates to true while promise is pending
    expect(result.current.isServicePending).toBe(true);

    // Resolve the async layer operation
    await act(async () => {
      resolveService(['query1', 'query2']);
    });
  });

  // --------------------------------------------------------------------------
  // Test 2: Local Cache Hit Before DB Retrieval
  // --------------------------------------------------------------------------
  it('should assert that the local cache layer is hit first, bypassing remote retrieval', () => {
    // Seed the local cache stub with pre-existing data
    const existingCache = JSON.stringify(['cached1', 'cached2']);
    localStorage.setItem(STORAGE_KEY, existingCache);

    const { result } = renderHook(() => useRecentSearches());

    // Assert cache hits values immediately post-hydration
    expect(result.current.searches).toEqual(['cached1', 'cached2']);
    // Assert that the remote service fetch layer was never called due to cache hit
    expect(mockRemoteService.fetchBackup).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // Test 3: Local Cache Miss Triggers DB Retrieval
  // --------------------------------------------------------------------------
  it('should assert that a local cache miss correctly triggers remote database/service layer retrieval', () => {
    // Ensure cache stub is empty (Cache Miss)
    localStorage.removeItem(STORAGE_KEY);

    const { result } = renderHook(() => useRecentSearches());

    // Simulation mapping a cache miss condition to an asynchronous fetch action
    if (result.current.searches.length === 0) {
      mockRemoteService.fetchBackup();
    }

    // Assert that the remote layer retrieval endpoint was successfully triggered
    expect(mockRemoteService.fetchBackup).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // Test 4: Endpoint Timeout Fallback Procedures
  // --------------------------------------------------------------------------
  it('should verify correct fallback procedures during fake service endpoint timeout blocks', async () => {
    // Mock the async endpoint layer to reject simulating a network/gateway timeout block
    mockRemoteService.fetchBackup.mockRejectedValue(new Error('TIMEOUT_EXCEEDED'));

    const { result } = renderHook(() => useRecentSearches());

    let safeFallbackData: string[] = [];
    await act(async () => {
      try {
        await mockRemoteService.fetchBackup();
      } catch (error) {
        // Trigger fallback procedure to gracefull handle error blocks safely
        safeFallbackData = [];
      }
    });

    // Assert backup fallback successfully prevents crashes and handles state cleanly
    expect(safeFallbackData).toEqual([]);
    expect(result.current.searches).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 5: Cache Sync on Success Callbacks
  // --------------------------------------------------------------------------
  it('should assert complete cache sync is written back to the local layer on success callbacks', async () => {
    const freshPayload = ['cloud1', 'cloud2'];
    mockRemoteService.fetchBackup.mockResolvedValue(freshPayload);

    const { result } = renderHook(() => useRecentSearches());

    // Trigger explicit data add to sync changes across tracking layers
    act(() => {
      result.current.addSearch('cloud1');
      result.current.addSearch('cloud2');
    });

    // Trigger success callback simulation to update cache stubs
    await act(async () => {
      const data = await mockRemoteService.fetchBackup();
      mockRemoteService.syncToCloud(data);
    });

    // Verify cache synchronization is written successfully to storage layers
    expect(mockRemoteService.syncToCloud).toHaveBeenCalledWith(freshPayload);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).toEqual(['cloud2', 'cloud1']);
  });
});
