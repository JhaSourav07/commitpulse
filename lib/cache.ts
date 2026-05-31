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
  private store = new Map<string, CacheItem<T>>();
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

    return hit.value;
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
    TTLCache.assertValidKey(key);

    const hit = this.store.get(key);
    if (!hit || Date.now() > hit.expiresAt) return false;
    hit.value = value;
    return true;
  }

  set(key: string, value: T, ttlMs: number): void {
    TTLCache.assertValidKey(key);
    if (key === '') throw new Error('Cache key cannot be empty');
    if (ttlMs <= 0) throw new RangeError(`ttlMs must be positive, got ${ttlMs}`);

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
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
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

  async get(key: string): Promise<T | null> {
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
      this.localCache.set(key, parsed, 5 * 60 * 1000);
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
    const updated = this.localCache.update(key, value);
    if (!updated) return false;

    if (!this.useRedis) {
      return true;
    }

    try {
      const res = await fetch(`${this.redisUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', key, JSON.stringify(value), 'KEEPTTL']),
      });

      if (!res.ok) {
        throw new Error(`Redis HTTP error: ${res.status}`);
      }
      return true;
    } catch (err) {
      console.error(`[DistributedCache] UPDATE failed for key "${key}":`, err);
      return true;
    }
  }

  clear(): void {
    this.localCache.clear();
  }

  destroy(): void {
    this.localCache.destroy();
  }
}
