import { randomUUID } from 'crypto';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';

/**
 * Represents a cached item with its expiration timestamp.
 */
type CacheItem<T> = {
  value: T;
  expiresAt: number;
};

/**
 * A Simple in-memory TTL(Time To Live) cache.
 *
 * Stores values in-process only and automatically removes expired entries.
 * This cache is not shared accross multiple server instances or severless invocations.
 *
 * @typeParam T - Type of values stored in the cache.
 */
export class TTLCache<T> {
  private store = new Map<string, CacheItem<T | Buffer>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly maxSize?: number;

  private static assertValidKey(key: unknown): asserts key is string {
    if (typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }
  }

  /**
   * Creates a new TTL cache instance.
   *
   * @param maxSize - Maximum number of items allowed in the cache.
   * @param cleanupIntervalMs - Interval in milliseconds for cleaning expired entries.
   */
  constructor(maxSize?: number, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize === undefined ? undefined : Math.max(1, maxSize);
    const interval = Math.max(1000, cleanupIntervalMs);

    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.sweep(), interval);

      const nodeTimer = timer as unknown as { unref?: () => void };
      if (nodeTimer && typeof nodeTimer.unref === 'function') {
        nodeTimer.unref();
      }

      this.cleanupInterval = timer;
    }
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private compress(value: T): T | Buffer {
    if (typeof value === 'string') {
      if (value.length > 1024) {
        try {
          return brotliCompressSync(Buffer.from(value));
        } catch {
          return value;
        }
      }
    } else if (value && typeof value === 'object') {
      try {
        const str = JSON.stringify(value);
        if (str.length > 1024) {
          return brotliCompressSync(Buffer.from(str));
        }
      } catch {
        return value;
      }
    }
    return value;
  }

  private decompress(stored: T | Buffer): T {
    if (Buffer.isBuffer(stored)) {
      try {
        const decompressed = brotliDecompressSync(stored).toString();
        try {
          return JSON.parse(decompressed) as T;
        } catch {
          return decompressed as unknown as T;
        }
      } catch {
        return stored as unknown as T;
      }
    }
    return stored;
  }

  /**
   * Retrieves a value from the cache.
   *
   * Returns 'null' if the key does not exist or if the entry has expired.
   *
   * @param key - Cache key.
   * @returns The cached value or 'null'.
   *
   * @example
   * const user = cache.get("user:1");
   */
  get(key: string): T | null {
    TTLCache.assertValidKey(key);

    const hit = this.store.get(key);
    if (!hit) return null;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return this.decompress(hit.value);
  }

  /**
   * Checks whether a key exists in the cache and has not expired.
   *
   * Unlike `get()`, this does not return the value.
   *
   * @param key - Cache key.
   * @returns `true` if the key exists and is still valid, `false` otherwise.
   *
   * @example
   * if (cache.has("user:1")) {
   *   // safe to call get()
   * }
   */
  has(key: string): boolean {
    TTLCache.assertValidKey(key);

    const hit = this.store.get(key);
    if (!hit) return false;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }
  /**
   * Removes a single entry from the cache.
   *
   * Does nothing if the key does not exist.
   *
   * @param key - Cache key to remove.
   * @returns `true` if the key existed and was deleted, `false` otherwise.
   *
   * @example
   * cache.delete("user:1");
   */
  delete(key: string): boolean {
    TTLCache.assertValidKey(key);

    return this.store.delete(key);
  }

  /**
   * Stores a value in the cache with a TTL.
   *
   * If the cache reaches its maximum capacity, the oldest item
   * may be removed to make room for new entries.
   *
   * @param key - Cache key.
   * @param value - Value to cache.
   * @param ttlMs - Time to live in milliseconds.
   * @returns void
   *
   * @example
   * cache.set("user:1", userData, 5000);
   */
  /**
   * Updates the value of an existing, non-expired cache entry without resetting its TTL.
   *
   * @param key - Cache key.
   * @param value - New value to store.
   * @returns `true` if the entry existed and was updated, `false` if missing or expired.
   */
  update(key: string, value: T): boolean {
    const hit = this.store.get(key);

    if (!hit) {
      return false;
    }

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return false;
    }

    hit.value = this.compress(value);
    return true;
  }

  set(key: string, value: T, ttlMs: number): void {
    TTLCache.assertValidKey(key);
    if (key === '') throw new Error('Cache key cannot be empty');
    if (ttlMs <= 0) throw new RangeError(`ttlMs must be positive, got ${ttlMs}`);
    if (Number.isNaN(ttlMs)) ttlMs = 60_000;

    if (key.length > 10000) {
      throw new Error('Cache key exceeds maximum allowed length to prevent memory bloat');
    }

    const maxSize = this.maxSize;
    if (maxSize !== undefined && this.store.size >= maxSize && !this.store.has(key)) {
      this.sweep();
      if (this.store.size >= maxSize) {
        const oldestKey = this.store.keys().next().value as string | undefined;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
    }

    this.store.delete(key);
    this.store.set(key, { value: this.compress(value), expiresAt: Date.now() + ttlMs });
  }

  /**
   * Removes all entries from the cache.
   *
   * @returns void
   *
   * @example
   * cache.clear();
   */
  clear(): void {
    this.store.clear();
  }

  size(): number {
    this.sweep();
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * A hybrid distributed cache client that uses Upstash Redis / Vercel KV REST API if configured,
 * and falls back to the in-memory TTLCache otherwise.
 *
 * This enables shared caching across serverless instances and Edge regions.
 */
export class DistributedCache<T> {
  private localCache: TTLCache<T>;
  private useRedis: boolean;
  private redisUrl: string = '';
  private redisToken: string = '';
  private localLocks = new Map<string, Promise<T>>();

  constructor(maxSize?: number, cleanupIntervalMs?: number) {
    this.localCache = new TTLCache<T>(maxSize, cleanupIntervalMs);
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    this.useRedis = Boolean(url && token);
    if (this.useRedis) {
      this.redisUrl = url!.replace(/\/$/, ''); // Remove trailing slash
      this.redisToken = token!;
    }
  }

  async get(key: string, localTtlMs: number = 5 * 60 * 1000): Promise<T | null> {
    if (!this.useRedis) {
      return this.localCache.get(key);
    }

    // Check local L1 cache first for fast in-instance lookups
    const localHit = this.localCache.get(key);
    if (localHit !== null) {
      return localHit;
    }

    try {
      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', key]),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }

      const data = await res.json();
      if (!data || data.result === undefined || data.result === null) {
        return null;
      }

      const parsed = JSON.parse(data.result) as T;
      // Backfill local cache so subsequent requests in this instance are instant
      this.localCache.set(key, parsed, localTtlMs);
      return parsed;
    } catch (err) {
      console.error(`[DistributedCache] GET failed for key "${key}":`, err);
      return this.localCache.get(key);
    }
  }

  async set(key: string, value: T, ttlMs: number): Promise<void> {
    // Always update local cache
    this.localCache.set(key, value, ttlMs);

    if (!this.useRedis) {
      return;
    }

    try {
      const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', key, JSON.stringify(value), 'EX', ttlSec]),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }
    } catch (err) {
      console.error(`[DistributedCache] SET failed for key "${key}":`, err);
    }
  }

  async delete(key: string): Promise<boolean> {
    const localDeleted = this.localCache.delete(key);
    if (!this.useRedis) {
      return localDeleted;
    }

    try {
      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['DEL', key]),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }

      const data = await res.json();
      return Boolean(data.result);
    } catch (err) {
      console.error(`[DistributedCache] DELETE failed for key "${key}":`, err);
      return localDeleted;
    }
  }

  async has(key: string): Promise<boolean> {
    if (this.localCache.has(key)) {
      return true;
    }
    if (!this.useRedis) {
      return false;
    }

    try {
      const value = await this.get(key);
      return value !== null;
    } catch {
      return false;
    }
  }

  async update(key: string, value: T): Promise<boolean> {
    if (!this.useRedis) {
      return this.localCache.update(key, value);
    }

    try {
      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', key, JSON.stringify(value), 'KEEPTTL', 'XX']),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }
      const data = await res.json();
      const updated = data.result === 'OK';

      if (updated) {
        this.localCache.update(key, value);
      } else {
        // Redis no longer has the key, so the L1 value is stale.
        this.localCache.delete(key);
      }

      return updated;
    } catch (err) {
      console.error(`[DistributedCache] UPDATE failed for key "${key}":`, err);
      return false;
    }
  }

  clear(): void {
    this.localCache.clear();
  }

  /**
   * Atomically increments a numeric counter stored under `key` and returns the new value.
   *
   * When Redis is available, uses EVAL + Lua script for true atomicity.
   * Falls back to the local TTLCache for non-Redis deployments (dev/test).
   *
   * @param key - Cache key holding a numeric counter.
   * @param ttlMs - Time-to-live in milliseconds. Only applied when the key is first created (count == 1).
   * @returns The incremented counter value.
   */
  async incr(key: string, ttlMs: number): Promise<number> {
    if (!this.useRedis) {
      const current = (this.localCache.get(key) as unknown as number) || 0;
      const next = current + 1;
      if (current === 0) {
        this.localCache.set(key, next as unknown as T, ttlMs);
      } else {
        this.localCache.update(key, next as unknown as T);
      }
      return next;
    }

    try {
      const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
      const luaScript = `local c = redis.call('INCR', KEYS[1])
if c == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return c`;

      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['EVAL', luaScript, '1', key, ttlSec.toString()]),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }

      const data = await res.json();
      const count = Number(data.result);

      this.localCache.set(key, count as unknown as T, ttlMs);
      return count;
    } catch (err) {
      console.error(`[DistributedCache] INCR failed for key "${key}":`, err);
      const current = (this.localCache.get(key) as unknown as number) || 0;
      const next = current + 1;
      if (current === 0) {
        this.localCache.set(key, next as unknown as T, ttlMs);
      } else {
        this.localCache.update(key, next as unknown as T);
      }
      return next;
    }
  }

  destroy(): void {
    this.localCache.destroy();
  }

  /**
   * Returns cached data when available, otherwise loads and stores fresh data.
   *
   * Uses a two-layer coordination strategy to reduce cache stampedes:
   * 1. Local Promise deduplication (L1) prevents duplicate fetches within the same instance.
   * 2. Redis mutex locking (L2) prevents duplicate fetches across distributed instances.
   *
   * `loadFn` receives the current cached value (or null) so callers can implement
   * stale refresh logic when needed.
   *
   * @param key - Cache key.
   * @param loadFn - Async function used to load fresh data.
   * @param ttlMs - Cache expiration time in milliseconds.
   * @param shouldFetch - Optional predicate that forces refresh even on cache hits.
   */
  async getOrSet(
    key: string,
    loadFn: (cached: T | null) => Promise<T>,
    ttlMs: number,
    shouldFetch?: (cached: T) => boolean
  ): Promise<T> {
    // Join an existing in-flight request before any async operation to avoid
    // concurrent loadFn execution for the same key.
    const existing = this.localLocks.get(key);
    if (existing) return existing;

    // Attempt to retrieve an existing value before triggering a refresh.
    const cached = await this.get(key, ttlMs);

    if (cached !== null && (!shouldFetch || !shouldFetch(cached))) {
      return cached;
    }

    // Double-check local locks after the await in case another call interleaved.
    const pendingLocal = this.localLocks.get(key);
    if (pendingLocal) return pendingLocal;

    const executeAndLock = async () => {
      if (!this.useRedis) {
        // Fallback: Local execution only
        const data = await loadFn(cached);
        await this.set(key, data, ttlMs);
        return data;
      }

      const lockKey = `lock:${key}`;
      const lockToken = randomUUID();
      const maxPollTime = 8000;
      const BASE_POLL_MS = 100;
      const MAX_POLL_MS = 1600;
      const start = Date.now();
      let attempt = 0;

      // Only DEL the lock if the stored token still matches ours, preventing
      // accidental deletion of a lock acquired by another instance after ours expired.
      const luaRelease = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;

      const releaseLock = async (): Promise<void> => {
        await fetch(`${this.redisUrl}/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['EVAL', luaRelease, 1, lockKey, lockToken]),
        }).catch((e) => {
          console.error(`[DistributedCache] Lock release failed for "${key}":`, e);
        });
      };

      while (Date.now() - start < maxPollTime) {
        try {
          // NX: acquire only if lock doesn't already exist.
          // PX 10000: auto-expire lock after 10 seconds to avoid deadlocks.
          const lockRes = await fetch(`${this.redisUrl}/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.redisToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(['SET', lockKey, lockToken, 'NX', 'PX', 10000]),
          });

          if (lockRes.ok) {
            const lockData = await lockRes.json();
            if (lockData.result === 'OK') {
              try {
                const freshData = await loadFn(cached);
                await this.set(key, freshData, ttlMs);

                // Release immediately so other instances can continue sooner.
                await releaseLock();

                return freshData;
              } catch (err) {
                // Remove lock even on failure so other instances don't wait
                // for the full lock timeout period.
                await releaseLock();
                throw err;
              }
            }
          }
        } catch (err) {
          // Redis network error during locking. Fallback to direct execution.
          console.error(`[DistributedCache] Lock error for "${key}":`, err);
          const fallbackData = await loadFn(cached);
          await this.set(key, fallbackData, ttlMs);
          return fallbackData;
        }

        // Exponential backoff reduces Redis round-trips under load compared to a fixed interval.
        const backoffMs = Math.min(BASE_POLL_MS * 2 ** attempt, MAX_POLL_MS);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        attempt++;
        const doubleCheck = await this.get(key, ttlMs);

        // Another instance may have already populated the cache while waiting.
        if (doubleCheck !== null && (!shouldFetch || !shouldFetch(doubleCheck))) {
          return doubleCheck;
        }
      }

      // Timed out waiting for lock. Fallback to direct execution to avoid hanging the client.
      const finalFallback = await loadFn(cached);
      await this.set(key, finalFallback, ttlMs);
      return finalFallback;
    };

    // Ensure local lock cleanup even if request execution fails.
    const promise = executeAndLock().finally(() => {
      this.localLocks.delete(key);
    });

    this.localLocks.set(key, promise);

    return promise;
  }
}
