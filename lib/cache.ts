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

  /**
   * Creates a new TTL cache instance.
   *
   * @param maxSize - Maximum number of items allowed in the cache.
   * @param cleanupIntervalMs - Interval in milliseconds for cleaning expired entries.
   */
  constructor(maxSize?: number, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize === undefined ? undefined : Math.max(1, maxSize);
    const interval = Math.max(1000, cleanupIntervalMs);

    // Only run cleanup if we are in an environment that supports setInterval
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.sweep(), interval);

      // Unref the timer so it doesn't prevent Node.js from exiting during tests or teardown
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
    const hit = this.store.get(key);
    if (!hit) return null;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return hit.value;
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
   * cache.set("user:1",userData,5000);
   */
  set(key: string, value: T, ttlMs: number): void {
    // Capacity eviction (FIFO / LRU-lite)
    const maxSize = this.maxSize;
    if (maxSize !== undefined && this.store.size >= maxSize && !this.store.has(key)) {
      this.sweep(); // Remove expired entries first to free up capacity
      if (this.store.size >= maxSize) {
        // Find the oldest item (first inserted) and remove it
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
    }

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

  /**
   * Stops the cleanup interval and clears the cache.
   *
   * @returns void
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}
