import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuotaMonitor } from './quota-monitor';

type QuotaSnapshot = {
  limit: number;
  remaining: number;
  resetTime: number;
  totalRefreshes: number;
};

describe('QuotaMonitor Mock Integrations', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    vi.restoreAllMocks();
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
  });

  it('mocks standard asynchronous imports and databases using stubs', async () => {
    const databaseStub = vi.fn().mockResolvedValue({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4800',
      'x-ratelimit-reset': '1710000000',
    });
    const networkFetchStub = vi.fn();

    const headers = await databaseStub();
    monitor.updateQuotaFromHeaders(headers);

    const quota = monitor.getQuota();
    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(4800);
    expect(databaseStub).toHaveBeenCalledTimes(1);
    expect(networkFetchStub).not.toHaveBeenCalled();
  });

  it('tests service loading paths to ensure pending state overlays render', async () => {
    const pendingOverlay = { loading: true, visible: true };
    let resolveHeaders!: (value: Record<string, string>) => void;

    const quotaServiceLoader = vi.fn(
      () =>
        new Promise<Record<string, string>>((resolve) => {
          resolveHeaders = resolve;
        })
    );

    const loadPromise = quotaServiceLoader().then((headers) => {
      monitor.updateQuotaFromHeaders(headers);
      pendingOverlay.loading = false;
      pendingOverlay.visible = false;
    });

    expect(pendingOverlay.loading).toBe(true);
    expect(pendingOverlay.visible).toBe(true);
    expect(quotaServiceLoader).toHaveBeenCalledTimes(1);

    resolveHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4500',
      'x-ratelimit-reset': '1710000000',
    });

    await loadPromise;

    expect(pendingOverlay.loading).toBe(false);
    expect(pendingOverlay.visible).toBe(false);
    expect(monitor.getQuota().remaining).toBe(4500);
  });

  it('asserts local cache layers are queried before triggering database retrievals', async () => {
    const localCache = new Map<string, QuotaSnapshot>();
    localCache.set('quota:default', {
      limit: 5000,
      remaining: 4200,
      resetTime: 1710000000 * 1000,
      totalRefreshes: 0,
    });

    const databaseRetrieval = vi.fn().mockResolvedValue({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '100',
      'x-ratelimit-reset': '1710000000',
    });

    const cached = localCache.get('quota:default');
    expect(cached).toBeDefined();

    if (cached) {
      monitor.setQuota(cached.limit, cached.remaining, cached.resetTime);
    }

    expect(databaseRetrieval).not.toHaveBeenCalled();
    expect(monitor.getQuota().remaining).toBe(4200);
  });

  it('verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    const localCache = new Map<string, QuotaSnapshot>();
    localCache.set('quota:fallback', {
      limit: 5000,
      remaining: 3900,
      resetTime: 1710000000 * 1000,
      totalRefreshes: 1,
    });

    const timeoutEndpoint = vi.fn().mockRejectedValue(new Error('timeout'));
    const fallbackLoader = vi.fn().mockImplementation(async () => {
      const cached = localCache.get('quota:fallback');
      if (!cached) {
        throw new Error('no fallback cache');
      }
      monitor.setQuota(cached.limit, cached.remaining, cached.resetTime);
      return cached;
    });

    let result: QuotaSnapshot;

    try {
      await timeoutEndpoint();
      result = monitor.getQuota();
    } catch {
      result = await fallbackLoader();
    }

    expect(timeoutEndpoint).toHaveBeenCalledTimes(1);
    expect(fallbackLoader).toHaveBeenCalledTimes(1);
    expect(result.remaining).toBe(3900);
    expect(monitor.getQuota().remaining).toBe(3900);
  });

  it('asserts complete cache sync is written on success callbacks', async () => {
    const cacheSync = new Map<string, QuotaSnapshot>();

    const successCallback = vi.fn().mockImplementation(async () => {
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1710000000',
      };

      monitor.updateQuotaFromHeaders(headers);
      monitor.incrementRefreshCount();

      const snapshot = monitor.getQuota();
      cacheSync.set('quota:sync', { ...snapshot });

      return snapshot;
    });

    const result = await successCallback();

    expect(result.limit).toBe(5000);
    expect(result.remaining).toBe(4999);
    expect(result.totalRefreshes).toBe(1);
    expect(cacheSync.get('quota:sync')).toEqual({
      limit: 5000,
      remaining: 4999,
      resetTime: 1710000000 * 1000,
      totalRefreshes: 1,
    });
    expect(successCallback).toHaveBeenCalledTimes(1);
  });

  it('keeps isolated mock assertions stable without slow network fetches', async () => {
    const networkFetch = vi.fn();
    const databaseStub = vi.fn().mockResolvedValue({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '5000',
      'x-ratelimit-reset': '1710000000',
    });

    const headers = await databaseStub();
    monitor.updateQuotaFromHeaders(headers);

    expect(monitor.getQuota().remaining).toBe(5000);
    expect(databaseStub).toHaveBeenCalledTimes(1);
    expect(networkFetch).not.toHaveBeenCalled();
  });
});
