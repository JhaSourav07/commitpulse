import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { DistributedCache } from './cache';
import logger from '@/lib/logger';

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('DistributedCache Error Resilience', () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('logs Redis GET failures and returns null when both Redis and local cache miss', async () => {
    process.env.KV_REST_API_URL = 'https://redis.test';
    process.env.KV_REST_API_TOKEN = 'token';

    vi.mocked(fetch).mockRejectedValue(new Error('network'));

    const cache = new DistributedCache<string>();

    await expect(cache.get('user')).resolves.toBeNull();

    expect(fetch).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();

    cache.destroy();
  });

  it('does not throw when Redis SET fails', async () => {
    process.env.KV_REST_API_URL = 'https://redis.test';
    process.env.KV_REST_API_TOKEN = 'token';

    vi.mocked(fetch).mockRejectedValue(new Error('redis offline'));

    const cache = new DistributedCache<string>();

    await expect(cache.set('key', 'value', 60000)).resolves.not.toThrow();

    expect(cache['localCache'].get('key')).toBe('value');

    expect(logger.error).toHaveBeenCalled();

    cache.destroy();
  });

  it('returns local delete result when Redis DELETE fails', async () => {
    process.env.KV_REST_API_URL = 'https://redis.test';
    process.env.KV_REST_API_TOKEN = 'token';

    const cache = new DistributedCache<string>();

    cache['localCache'].set('key', 'value', 60000);

    vi.mocked(fetch).mockRejectedValue(new Error('delete failed'));

    await expect(cache.delete('key')).resolves.toBe(true);

    expect(logger.error).toHaveBeenCalled();

    cache.destroy();
  });

  it('returns false when Redis update throws', async () => {
    process.env.KV_REST_API_URL = 'https://redis.test';
    process.env.KV_REST_API_TOKEN = 'token';

    vi.mocked(fetch).mockRejectedValue(new Error('update failed'));

    const cache = new DistributedCache<string>();

    await expect(cache.update('missing', 'value')).resolves.toBe(false);

    expect(logger.error).toHaveBeenCalled();

    cache.destroy();
  });

  it('falls back to executing loadFn when lock acquisition fails', async () => {
    process.env.KV_REST_API_URL = 'https://redis.test';
    process.env.KV_REST_API_TOKEN = 'token';

    vi.mocked(fetch).mockRejectedValue(new Error('lock failure'));

    const cache = new DistributedCache<string>();

    const loader = vi.fn().mockResolvedValue('fresh');

    await expect(cache.getOrSet('user', loader, 60000)).resolves.toBe('fresh');

    expect(loader).toHaveBeenCalledTimes(1);

    expect(logger.error).toHaveBeenCalled();

    cache.destroy();
  });
});
