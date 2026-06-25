import 'server-only';
import { randomUUID } from 'crypto';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';
import logger from '@/lib/logger';

/**
 * Configuration options for the distributed mutex lock used by {@link DistributedCache.getOrSet}.
 */
export interface LockConfig {
  /**
   * TTL for the Redis lock key (milliseconds). The lock auto-releases after this duration.
   * Must be long enough to cover the expected execution time of `loadFn`.
   * @default 10000
   */
  lockTtlMs?: number;

  /**
   * Maximum time to spend polling for the lock (milliseconds).
   * After this duration, `getOrSet` falls back to executing `loadFn` directly.
   * @default 8000
   */
  maxPollTimeMs?: number;

  /**
   * When `true`, a background heartbeat extends the lock TTL while `loadFn` is executing,
   * preventing premature lock expiry for long-running operations.
   * @default true
   */
  enableLockExtension?: boolean;

  /**
   * Number of times to retry a failed lock release before giving up.
   * @default 2
   */
  releaseRetries?: number;
}

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
  //private store = new Map<string, CacheItem<T>>();

  private store = new Map<string, CacheItem<T | Buffer>>();

  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly maxSize?: number;
  private static assertValidKey(key: unknown): asserts key is string {
    if (typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }

    if (key.trim().length === 0) {
      throw new TypeError('Cache key cannot be empty');
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
    //TTLCache.assertValidKey(key);
    if (key === null || key === undefined) {
      throw new TypeError('Cache key must be a string');
    }

    if (typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }

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
    //TTLCache.assertValidKey(key);
    if (key === null || key === undefined) {
      throw new TypeError('Cache key must be a string');
    }

    if (typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }

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
    //TTLCache.assertValidKey(key);
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new TypeError('Cache key cannot be empty');
    }

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
    if (url && token) {
      this.useRedis = true;
      this.redisUrl = url.replace(/\/$/, ''); // Remove trailing slash
      this.redisToken = token;
    } else {
      this.useRedis = false;
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
      logger.error('Cache GET failed', {
        component: 'DistributedCache',
        key,
        error: err,
      });
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
      logger.error('Cache SET failed', {
        component: 'DistributedCache',
        key,
        error: err,
      });
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
      logger.error('Cache DELETE failed', {
        component: 'DistributedCache',
        key,
        error: err,
      });
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
      logger.error('Cache UPDATE failed', {
        component: 'DistributedCache',
        key,
        error: err,
      });
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
      // Fail closed — no shared state means no reliable distributed rate limiting.
      // In serverless (Vercel, AWS Lambda, etc.) each cold start resets the in-memory
      // counter, so an in-memory fallback would silently reset the limit and enable
      // Denial-of-Wallet attacks on the shared GitHub token pool.
      if (process.env.NODE_ENV === 'production') {
        logger.error('Redis not configured in production — rate limiting disabled (fail-closed)', {
          component: 'DistributedCache',
          key,
        });
        return Number.MAX_SAFE_INTEGER;
      }
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
      logger.error(
        'Cache INCR failed — failing closed to avoid bypassing distributed rate limits',
        {
          component: 'DistributedCache',
          key,
          error: err,
        }
      );
      // Do NOT fall back to a per-instance local counter here. Serverless
      // instances don't share memory, so a local fallback would let each
      // instance maintain its own disconnected counter — silently multiplying
      // the effective rate limit by the number of active instances during
      // any Redis blip. Failing closed (returning a large value that exceeds
      // any realistic limit) ensures callers treat this as "limit exceeded"
      // rather than "limit reset," which is the safer default during an outage.
      return Number.MAX_SAFE_INTEGER;
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
   * @param lockConfig - Optional distributed lock tuning.
   */
  async getOrSet(
    key: string,
    loadFn: (cached: T | null) => Promise<T>,
    ttlMs: number,
    shouldFetch?: (cached: T) => boolean,
    lockConfig?: LockConfig
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
        const data = await loadFn(cached);
        await this.set(key, data, ttlMs);
        return data;
      }

      const lockKey = `lock:${key}`;
      const lockToken = randomUUID();
      const lockTtlMs = lockConfig?.lockTtlMs ?? 10000;
      const maxPollTime = lockConfig?.maxPollTimeMs ?? 8000;
      const enableLockExtension = lockConfig?.enableLockExtension ?? true;
      const releaseRetries = lockConfig?.releaseRetries ?? 2;
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
        for (let r = 0; r <= releaseRetries; r++) {
          try {
            await fetch(`${this.redisUrl}/`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${this.redisToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(['EVAL', luaRelease, 1, lockKey, lockToken]),
            });
            return;
          } catch (e) {
            if (r < releaseRetries) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            } else {
              console.error(
                '[DistributedCache] Lock release failed for key "%s" after %d attempts:',
                key,
                releaseRetries + 1,
                e
              );
            }
          }
        }
      };

      while (Date.now() - start < maxPollTime) {
        let acquired = false;

        try {
          // NX: acquire only if lock doesn't already exist.
          // PX: auto-expire lock to avoid deadlocks.
          const lockRes = await fetch(`${this.redisUrl}/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.redisToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(['SET', lockKey, lockToken, 'NX', 'PX', lockTtlMs]),
          });

          if (lockRes.ok) {
            const lockData = await lockRes.json();
            acquired = lockData.result === 'OK';
          } else {
            throw new Error(`Redis lock HTTP error: ${lockRes.status}`);
          }
        } catch (err) {
          // Redis network error during locking. Fallback to direct execution.
          logger.error('Cache lock failed', {
            component: 'DistributedCache',
            key,
            error: err,
          });
          const fallbackData = await loadFn(cached);
          await this.set(key, fallbackData, ttlMs);
          return fallbackData;
        }

        if (acquired) {
          let extensionTimer: ReturnType<typeof setInterval> | null = null;

          if (enableLockExtension) {
            // Heartbeat fires at 60% of lockTtlMs so there is always time before expiry.
            // When lockTtlMs is small (<1667ms), clamp to lockTtlMs/2 but with at least
            // 100ms of headroom so the heartbeat always fires before the lock expires.
            const rawInterval = Math.floor(lockTtlMs * 0.6);
            const minInterval = Math.min(1000, Math.max(100, lockTtlMs - 100));
            const extensionInterval = Math.max(minInterval, rawInterval);

            extensionTimer = setInterval(async () => {
              try {
                // Atomically extend only if we still own the lock (token matches).
                // Using SET XX without a token check would let us extend a lock that
                // another instance acquired after ours expired — do not use SET XX alone.
                const luaExtend = `
                  if redis.call("GET", KEYS[1]) == ARGV[1] then
                    redis.call("PEXPIRE", KEYS[1], ARGV[2])
                  end
                `;
                await fetch(`${this.redisUrl}/`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${this.redisToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify([
                    'EVAL',
                    luaExtend,
                    1,
                    lockKey,
                    lockToken,
                    String(lockTtlMs),
                  ]),
                });
              } catch {
                // Silently ignore extension failures — the lock will expire naturally.
              }
            }, extensionInterval);
            if (typeof extensionTimer === 'object' && typeof extensionTimer.unref === 'function') {
              extensionTimer.unref();
            }
          }

          try {
            const freshData = await loadFn(cached);
            await this.set(key, freshData, ttlMs);
            return freshData;
          } finally {
            if (extensionTimer) clearInterval(extensionTimer);
            await releaseLock();
          }
        }

        // Exponential backoff with jitter to prevent thundering herd
        // when multiple instances contend for the same lock.
        const baseBackoff = Math.min(BASE_POLL_MS * 2 ** attempt, MAX_POLL_MS);
        const jitter = 0.5 + Math.random() * 0.5;
        const backoffMs = Math.round(baseBackoff * jitter);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        attempt++;
        const doubleCheck = await this.get(key, ttlMs);

        if (doubleCheck !== null && (!shouldFetch || !shouldFetch(doubleCheck))) {
          return doubleCheck;
        }
      }

      // Timed out waiting for lock. Fallback to direct execution.
      const finalFallback = await loadFn(cached);
      await this.set(key, finalFallback, ttlMs);
      return finalFallback;
    };

    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const promise = executeAndLock().finally(() => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.localLocks.delete(key);
    });

    this.localLocks.set(key, promise);

    // Safety Eviction: Forcefully evict locks that hang longer than 60s
    // to prevent memory leaks (fixes Issue #6177).
    timeoutTimer = setTimeout(() => {
      if (this.localLocks.get(key) === promise) {
        this.localLocks.delete(key);
        logger.error('Safety eviction triggered for hanging lock', {
          component: 'DistributedCache',
          key,
        });
      }
    }, 60000);

    if (timeoutTimer && typeof timeoutTimer.unref === 'function') {
      timeoutTimer.unref();
    }

    return promise;
  }
}
