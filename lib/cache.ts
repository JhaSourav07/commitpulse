import { randomUUID } from 'crypto';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';
import logger from '@/lib/logger';

export const CACHE_VERSION = 'v1';

export interface CacheEnvelope<T> {
  v: string;
  t: number; // Write timestamp
  ttl: number; // Nominal TTL in milliseconds
  d: T | Buffer;
}

export interface CacheStats {
  hits: number;
  misses: number;
  writes: number;
  evictions: number;
  swrRefreshes: number;
  size: number;
}

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
  value: CacheEnvelope<T>;
  expiresAt: number; // Physical cache eviction time
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
  private store = new Map<string, CacheItem<T>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly maxSize?: number;

  private stats: Omit<CacheStats, 'size'> = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0,
    swrRefreshes: 0,
  };

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

  private wrap(value: T | Buffer, ttl: number): CacheEnvelope<T> {
    return {
      v: CACHE_VERSION,
      t: Date.now(),
      ttl,
      d: value,
    };
  }

  private unwrap(item: unknown): CacheEnvelope<T> | null {
    if (item && typeof item === 'object' && 'v' in item && 'd' in item && 't' in item) {
      const env = item as CacheEnvelope<T>;
      if (env.v === CACHE_VERSION) {
        return env;
      }
      return null; // Version mismatch
    }
    // Backward compatibility for legacy cached entries (treat as v1 wrapper on the fly)
    if (item !== null && item !== undefined) {
      return {
        v: CACHE_VERSION,
        t: Date.now() - 60 * 1000,
        ttl: 60 * 1000,
        d: item as T | Buffer,
      };
    }
    return null;
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.store.size,
    };
  }

  incrementSwrRefreshes(): void {
    this.stats.swrRefreshes++;
  }

  invalidatePattern(pattern: RegExp | string): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  getWithMetadata(key: string): { value: T; expiresAt: number; writtenAt: number } | null {
    if (key === null || key === undefined || typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }

    const hit = this.store.get(key);
    if (!hit) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    const unwrapped = this.unwrap(hit.value);
    if (!unwrapped) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return {
      value: this.decompress(unwrapped.d),
      expiresAt: unwrapped.t + unwrapped.ttl, // return nominal expiration
      writtenAt: unwrapped.t,
    };
  }

  /**
   * Retrieves a value from the cache.
   *
   * Returns 'null' if the key does not exist or if the entry has expired.
   */
  get(key: string): T | null {
    const meta = this.getWithMetadata(key);
    if (!meta) return null;
    // Standard get should return null if past nominal expiration
    if (Date.now() > meta.expiresAt) {
      return null;
    }
    return meta.value;
  }

  /**
   * Checks whether a key exists in the cache and has not expired.
   */
  has(key: string): boolean {
    if (key === null || key === undefined || typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }

    const hit = this.store.get(key);
    if (!hit) return false;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return false;
    }

    const unwrapped = this.unwrap(hit.value);
    if (!unwrapped) {
      this.store.delete(key);
      return false;
    }

    // Standard check has() should be false if past nominal expiration
    if (Date.now() > unwrapped.t + unwrapped.ttl) {
      return false;
    }

    return true;
  }

  /**
   * Removes a single entry from the cache.
   */
  delete(key: string): boolean {
    TTLCache.assertValidKey(key);
    return this.store.delete(key);
  }

  /**
   * Updates the value of an existing, non-expired cache entry without resetting its TTL.
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

    const unwrapped = this.unwrap(hit.value);
    if (!unwrapped) {
      this.store.delete(key);
      return false;
    }

    unwrapped.d = this.compress(value);
    unwrapped.t = Date.now();
    return true;
  }

  set(key: string, value: T, ttlMs: number, swrMs: number = 0): void {
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
          this.stats.evictions++;
        }
      }
    }

    const compressed = this.compress(value);
    const envelope = this.wrap(compressed, ttlMs);

    this.store.delete(key);
    this.store.set(key, { value: envelope, expiresAt: Date.now() + ttlMs + swrMs });
    this.stats.writes++;
  }

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

  private stats: Omit<CacheStats, 'size'> = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0,
    swrRefreshes: 0,
  };

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

  getStats(): CacheStats {
    const local = this.localCache.getStats();
    return {
      hits: this.stats.hits + local.hits,
      misses: this.stats.misses + local.misses,
      writes: this.stats.writes + local.writes,
      evictions: this.stats.evictions + local.evictions,
      swrRefreshes: this.stats.swrRefreshes + local.swrRefreshes,
      size: local.size,
    };
  }

  invalidatePattern(pattern: RegExp | string): number {
    return this.localCache.invalidatePattern(pattern);
  }

  async getWithMetadata(
    key: string,
    localTtlMs: number = 5 * 60 * 1000
  ): Promise<{ value: T; expiresAt: number; writtenAt: number } | null> {
    // Check local L1 cache first
    const localHit = this.localCache.getWithMetadata(key);
    if (localHit !== null) {
      return localHit;
    }

    if (!this.useRedis) {
      return null;
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
        this.stats.misses++;
        return null;
      }

      const rawResult = JSON.parse(data.result);
      if (
        rawResult &&
        typeof rawResult === 'object' &&
        'v' in rawResult &&
        'd' in rawResult &&
        't' in rawResult &&
        'ttl' in rawResult
      ) {
        const envelope = rawResult as CacheEnvelope<T>;
        if (envelope.v === CACHE_VERSION) {
          const expiresAt = envelope.t + envelope.ttl;
          this.localCache.set(key, envelope.d as T, envelope.ttl);
          this.stats.hits++;
          return {
            value: envelope.d as T,
            expiresAt,
            writtenAt: envelope.t,
          };
        } else {
          // Version mismatch
          this.stats.misses++;
          return null;
        }
      } else {
        // Backward compatibility for unversioned legacy items
        const parsed = rawResult as T;
        const expiresAt = Date.now() + localTtlMs;
        this.localCache.set(key, parsed, localTtlMs);
        this.stats.hits++;
        return {
          value: parsed,
          expiresAt,
          writtenAt: Date.now() - 60 * 1000,
        };
      }
    } catch (err) {
      logger.error('Cache GET failed', {
        component: 'DistributedCache',
        key,
        error: err,
      });
      return this.localCache.getWithMetadata(key);
    }
  }

  async get(key: string, localTtlMs: number = 5 * 60 * 1000): Promise<T | null> {
    const meta = await this.getWithMetadata(key, localTtlMs);
    if (!meta) return null;
    if (Date.now() > meta.expiresAt) {
      return null;
    }
    return meta.value;
  }

  async set(key: string, value: T, ttlMs: number, swrMs: number = 0): Promise<void> {
    // Always update local cache
    this.localCache.set(key, value, ttlMs, swrMs);
    this.stats.writes++;

    if (!this.useRedis) {
      return;
    }

    try {
      const envelope: CacheEnvelope<T> = {
        v: CACHE_VERSION,
        t: Date.now(),
        ttl: ttlMs,
        d: value,
      };

      const physicalTtl = ttlMs + swrMs;
      const ttlSec = Math.max(1, Math.ceil(physicalTtl / 1000));
      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', key, JSON.stringify(envelope), 'EX', ttlSec]),
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
      const envelope: CacheEnvelope<T> = {
        v: CACHE_VERSION,
        t: Date.now(),
        ttl: 60 * 1000, // Guess default TTL
        d: value,
      };

      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', key, JSON.stringify(envelope), 'KEEPTTL', 'XX']),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }
      const data = await res.json();
      const updated = data.result === 'OK';

      if (updated) {
        this.localCache.update(key, value);
        this.stats.writes++;
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
      return true;
    }
  }

  clear(): void {
    this.localCache.clear();
  }

  async incr(key: string, ttlMs: number): Promise<number> {
    this.stats.writes++;
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
      logger.error('Cache INCR failed', {
        component: 'DistributedCache',
        key,
        error: err,
      });
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
   * @param lockConfig - Optional distributed lock tuning.
   * @param swrMs - Optional stale-while-revalidate duration in milliseconds.
   */
  async getOrSet(
    key: string,
    loadFn: (cached: T | null) => Promise<T>,
    ttlMs: number,
    shouldFetch?: (cached: T) => boolean,
    lockConfig?: LockConfig,
    swrMs?: number
  ): Promise<T> {
    // Join an existing in-flight request before any async operation
    const existing = this.localLocks.get(key);
    if (existing) return existing;

    // Retrieve cached item with metadata
    const cachedMeta = await this.getWithMetadata(key, ttlMs);

    if (cachedMeta !== null) {
      const forceFetch = shouldFetch && shouldFetch(cachedMeta.value);
      if (!forceFetch) {
        if (Date.now() < cachedMeta.expiresAt) {
          return cachedMeta.value;
        }

        // Check if inside SWR window
        if (swrMs && Date.now() < cachedMeta.expiresAt + swrMs) {
          this.stats.swrRefreshes++;
          this.localCache.incrementSwrRefreshes();
          // Trigger asynchronous background refresh
          this.executeAndLockBg(key, loadFn, ttlMs, cachedMeta.value, lockConfig, swrMs);
          // Return stale cached value immediately
          return cachedMeta.value;
        }
      }
    }

    const pendingLocal = this.localLocks.get(key);
    if (pendingLocal) return pendingLocal;

    const promise = this.executeAndLockBg(
      key,
      loadFn,
      ttlMs,
      cachedMeta ? cachedMeta.value : null,
      lockConfig,
      swrMs
    );
    return promise;
  }

  private async executeAndLockBg(
    key: string,
    loadFn: (cached: T | null) => Promise<T>,
    ttlMs: number,
    cached: T | null,
    lockConfig?: LockConfig,
    swrMs: number = 0
  ): Promise<T> {
    const executeAndLock = async () => {
      if (!this.useRedis) {
        const data = await loadFn(cached);
        await this.set(key, data, ttlMs, swrMs);
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
          logger.error('Cache lock failed', {
            component: 'DistributedCache',
            key,
            error: err,
          });
          const fallbackData = await loadFn(cached);
          await this.set(key, fallbackData, ttlMs, swrMs);
          return fallbackData;
        }

        if (acquired) {
          let extensionTimer: ReturnType<typeof setInterval> | null = null;

          if (enableLockExtension) {
            const rawInterval = Math.floor(lockTtlMs * 0.6);
            const minInterval = Math.min(1000, Math.max(100, lockTtlMs - 100));
            const extensionInterval = Math.max(minInterval, rawInterval);

            extensionTimer = setInterval(async () => {
              try {
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
                // Ignore extension failures
              }
            }, extensionInterval);
            if (typeof extensionTimer === 'object' && typeof extensionTimer.unref === 'function') {
              extensionTimer.unref();
            }
          }

          try {
            const freshData = await loadFn(cached);
            await this.set(key, freshData, ttlMs, swrMs);
            return freshData;
          } finally {
            if (extensionTimer) clearInterval(extensionTimer);
            await releaseLock();
          }
        }

        const baseBackoff = Math.min(BASE_POLL_MS * 2 ** attempt, MAX_POLL_MS);
        const jitter = 0.5 + Math.random() * 0.5;
        const backoffMs = Math.round(baseBackoff * jitter);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        attempt++;
        const doubleCheck = await this.get(key, ttlMs);

        if (doubleCheck !== null) {
          return doubleCheck;
        }
      }

      const finalFallback = await loadFn(cached);
      await this.set(key, finalFallback, ttlMs, swrMs);
      return finalFallback;
    };

    const promise = executeAndLock().finally(() => {
      this.localLocks.delete(key);
    });

    this.localLocks.set(key, promise);

    return promise;
  }
}
