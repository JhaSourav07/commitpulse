type CacheItem<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 60_000;

function validateKey(key: string, allowEmpty = false): void {
  if (key === null || key === undefined) {
    throw new TypeError('Cache key cannot be null or undefined');
  }
  if (!allowEmpty && key === '') {
    throw new Error('Cache key cannot be empty');
  }
}

function resolvedTtl(ttlMs: number): number {
  if (ttlMs <= 0 && !Number.isNaN(ttlMs)) {
    throw new RangeError('ttlMs must be a positive number');
  }
  if (Number.isNaN(ttlMs)) {
    return DEFAULT_TTL_MS;
  }
  return ttlMs;
}

export class TTLCache<T> {
  private store = new Map<string, CacheItem<T>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly maxSize?: number;

  constructor(maxSize?: number, cleanupIntervalMs: number = 60_000) {
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

  get(key: string): T | null {
    validateKey(key, true);
    if (key === '') return null;
    const hit = this.store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return hit.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    validateKey(key);
    const ttl = resolvedTtl(ttlMs);

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

    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  has(key: string): boolean {
    validateKey(key, true);
    if (key === '') return false;
    const hit = this.store.get(key);
    if (!hit) return false;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    validateKey(key);
    return this.store.delete(key);
  }

  /**
   * Updates the value of an existing, non-expired key WITHOUT resetting its TTL.
   * Returns true if the key existed and was updated, false otherwise.
   */
  update(key: string, value: T): boolean {
    validateKey(key);
    const hit = this.store.get(key);
    if (!hit) return false;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return false;
    }
    // Preserve the original expiresAt — do not reset TTL
    this.store.set(key, { value, expiresAt: hit.expiresAt });
    return true;
  }

  /**
   * Returns the count of non-expired entries in the cache.
   */
  size(): number {
    const now = Date.now();
    let count = 0;
    for (const item of this.store.values()) {
      if (now <= item.expiresAt) count++;
    }
    return count;
  }

  clear(): void {
    this.store.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// ---------------------------------------------------------------------------
// DistributedCache
// ---------------------------------------------------------------------------
// Falls back to an in-process TTLCache when no Redis env vars are configured.
// When KV_REST_API_URL / KV_REST_API_TOKEN (or their UPSTASH_ aliases) are
// present, every get/set is forwarded to the Upstash Redis REST API.
// ---------------------------------------------------------------------------

type RedisGetResponse = { result: string | null };
type RedisSetResponse = { result: string };

export class DistributedCache<T> {
  private local: TTLCache<T>;
  private redisUrl: string | undefined;
  private redisToken: string | undefined;

  constructor(maxSize?: number, cleanupIntervalMs?: number) {
    this.local = new TTLCache<T>(maxSize, cleanupIntervalMs);
    this.redisUrl =
      process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    this.redisToken =
      process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  }

  private get isRedisConfigured(): boolean {
    return Boolean(this.redisUrl && this.redisToken);
  }

  async get(key: string): Promise<T | null> {
    validateKey(key);

    if (!this.isRedisConfigured) {
      return this.local.get(key);
    }

    const response = await fetch(`${this.redisUrl}/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['GET', key]),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as RedisGetResponse;
    if (data.result === null) return null;

    try {
      return JSON.parse(data.result) as T;
    } catch {
      return data.result as unknown as T;
    }
  }

  async set(key: string, value: T, ttlMs: number): Promise<void> {
    validateKey(key);
    const ttl = resolvedTtl(ttlMs);

    if (!this.isRedisConfigured) {
      this.local.set(key, value, ttl);
      return;
    }

    const ttlSeconds = Math.ceil(ttl / 1000);

    await fetch(`${this.redisUrl}/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', key, JSON.stringify(value), 'EX', ttlSeconds]),
    });
  }

  destroy(): void {
    this.local.destroy();
  }
}
