type CacheItem<T> = {
  value: T;
  expiresAt: number;
};

export class TTLCache<T> {
  private store = new Map<string, CacheItem<T>>();

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
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
