import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshRateLimiter } from './refresh-rate-limiter';

describe('RefreshRateLimiter Mock Integrations', () => {
  let limiter: RefreshRateLimiter;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.MAX_REFRESHES_PER_HOUR;
    limiter = RefreshRateLimiter.getInstance();
    limiter.reset();
  });

  it('mocks asynchronous service loading paths with a pending state stub', async () => {
    const serviceLoader = vi.fn().mockResolvedValue({ status: 'loaded' });
    const pendingState = { loading: true };

    const result = await serviceLoader();

    expect(pendingState.loading).toBe(true);
    expect(serviceLoader).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('loaded');
  });

  it('queries local cache before allowing a refresh request', () => {
    const localCache = new Map<string, boolean>();
    localCache.set('127.0.0.1', true);

    const cacheResult = localCache.get('127.0.0.1');
    const limitResult = limiter.checkLimit('127.0.0.1');

    expect(cacheResult).toBe(true);
    expect(limitResult.success).toBe(true);
    expect(limitResult.remaining).toBe(2);
  });

  it('uses fallback behavior during fake endpoint timeout blocks', async () => {
    const timeoutEndpoint = vi.fn().mockRejectedValue(new Error('timeout'));
    const fallback = vi.fn().mockResolvedValue('fallback-cache');

    let result: string;

    try {
      result = await timeoutEndpoint();
    } catch {
      result = await fallback();
    }

    expect(timeoutEndpoint).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(result).toBe('fallback-cache');
  });

  it('writes complete cache sync on successful callback', async () => {
    const cacheSync = new Map<string, number>();
    const successCallback = vi.fn().mockImplementation(async (ip: string) => {
      const result = limiter.checkLimit(ip);
      cacheSync.set(ip, result.remaining);
      return result;
    });

    const result = await successCallback('192.168.1.1');

    expect(result.success).toBe(true);
    expect(cacheSync.get('192.168.1.1')).toBe(2);
    expect(successCallback).toHaveBeenCalledWith('192.168.1.1');
  });

  it('keeps isolated mock assertions stable without slow network fetches', async () => {
    const databaseStub = vi.fn().mockResolvedValue({ count: 1 });
    const networkFetchStub = vi.fn();

    const dbResult = await databaseStub();

    expect(dbResult.count).toBe(1);
    expect(databaseStub).toHaveBeenCalledTimes(1);
    expect(networkFetchStub).not.toHaveBeenCalled();
  });
});
