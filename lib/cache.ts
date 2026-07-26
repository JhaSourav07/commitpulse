type CacheItem<T> = {
  value: T;
  expiresAt: number;
};

export class TTLCache<T> {
  private store = new Map<string, CacheItem<T>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly maxSize: number;

  constructor(maxSize: number = 500, cleanupIntervalMs: number = 60_000) {
    this.maxSize = Math.max(1, maxSize);

    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.evictExpired(), cleanupIntervalMs);

      const nodeTimer = timer as unknown as { unref?: () => void };
      if (nodeTimer && typeof nodeTimer.unref === 'function') {
        nodeTimer.unref();
      }

      this.cleanupInterval = timer;
    }
  }

  get(key: string): T | null {
    const hit = this.store.get(key);
    if (!hit) return null;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return hit.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.store.has(key)) {
      this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return;
    }

    this.evictExpired();

    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.store) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
