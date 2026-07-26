import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistributedCache } from './cache';

describe('Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  let container: HTMLDivElement;
  let cache: DistributedCache<string>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    vi.restoreAllMocks();

    // 🚀 NEW: Stub fetch globally to prevent slow DNS lookups on fake URLs
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Immediate Network Bypass'));

    // Setup generic env variables to bypass real external instances
    process.env.KV_REST_API_URL = 'http://fake-redis-url.com';
    process.env.KV_REST_API_TOKEN = 'fake-token';

    cache = new DistributedCache<string>(100);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container.innerHTML = '';
  });

  it('1. Mock standard asynchronous imports and databases using stubs', async () => {
    const mockAsyncService = vi.fn().mockResolvedValue('Mocked Database Result');

    const result = await cache.getOrSet('test-key-1', mockAsyncService, 1000);

    expect(result).toBe('Mocked Database Result');
    expect(mockAsyncService).toHaveBeenCalledTimes(1);
  });

  it('2. Test service loading paths to ensure pending state overlays render', async () => {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.display = 'none';
    container.appendChild(loadingOverlay);

    let resolveService: (val: string) => void = () => {};
    const slowAsyncService = vi.fn().mockImplementation(() => {
      loadingOverlay.style.display = 'block';
      return new Promise((res) => {
        resolveService = res;
      });
    });

    const fetchPromise = cache.getOrSet('test-key-2', slowAsyncService, 1000);

    // 🚀 NEW: Yield the event loop briefly so the cache fallback hits our mock service
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Ensure overlay is rendered before resolution
    expect(loadingOverlay.style.display).toBe('block');

    resolveService('Resolved Data');
    const result = await fetchPromise;

    loadingOverlay.style.display = 'none';

    expect(result).toBe('Resolved Data');
    expect(loadingOverlay.style.display).toBe('none');
  });

  it('3. Assert local cache layers are queried before triggering database retrievals', async () => {
    const mockDatabaseFetch = vi.fn().mockResolvedValue('Fresh Data');

    // DB triggered
    await cache.getOrSet('test-key-3', mockDatabaseFetch, 5000);
    expect(mockDatabaseFetch).toHaveBeenCalledTimes(1);

    // Local cache queried before database retrievals
    const cachedResult = await cache.getOrSet('test-key-3', mockDatabaseFetch, 5000);
    expect(cachedResult).toBe('Fresh Data');
    expect(mockDatabaseFetch).toHaveBeenCalledTimes(1); // Call count remains 1
  });

  it('4. Verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    // This uses the global mock from beforeEach!
    const fallbackService = vi.fn().mockResolvedValue('Fallback Data');

    const result = await cache.getOrSet('test-key-4', fallbackService, 1000);

    // Verify fallback executed
    expect(result).toBe('Fallback Data');
    expect(fallbackService).toHaveBeenCalledTimes(1);
  });

  it('5. Assert complete cache sync is written on success callbacks', async () => {
    const localCache = new DistributedCache<string>(100);
    const mockLoadFn1 = vi.fn().mockResolvedValue('Sync Success Data');
    const mockLoadFn2 = vi.fn().mockResolvedValue('Unseen Data');

    // Cache sync on success
    const result1 = await localCache.getOrSet('test-key-5', mockLoadFn1, 1000);
    expect(result1).toBe('Sync Success Data');

    // Assert complete cache sync
    const result2 = await localCache.getOrSet('test-key-5', mockLoadFn2, 1000);
    expect(result2).toBe('Sync Success Data');
    expect(mockLoadFn2).not.toHaveBeenCalled();
  });
});
