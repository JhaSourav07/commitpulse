// lib/cache/ttl-cache.ts
import { TTLCache } from '../cache';

export class CostAwareCache<T> extends TTLCache<T> {
  private readonly baseTtlMs: number;
  private readonly complexityThreshold: number;
  private readonly maxTtlMs: number;

  constructor(
    maxSize = 1000,
    baseTtlMs = 5 * 60 * 1000, // 5 minutes base TTL
    complexityThreshold = 50, // Cost limit threshold
    maxTtlMs = 60 * 60 * 1000 // 1 hour max TTL
  ) {
    super(maxSize);
    this.baseTtlMs = baseTtlMs;
    this.complexityThreshold = complexityThreshold;
    this.maxTtlMs = maxTtlMs;
  }

  /**
   * Sets a value in the cache with a TTL scaled by the query's complexity cost.
   * Higher complexity queries are cached for longer to avoid repeated expensive operations.
   */
  setWithCost(key: string, value: T, complexity: number): void {
    let ttlMs = this.baseTtlMs;

    if (complexity > this.complexityThreshold) {
      // Scale TTL linearly relative to the excess complexity
      const ratio = (complexity - this.complexityThreshold) / this.complexityThreshold;
      const scalingFactor = 1 + ratio;
      ttlMs = Math.min(Math.round(this.baseTtlMs * scalingFactor), this.maxTtlMs);
    }

    this.set(key, value, ttlMs);
  }

  /**
   * Helper to retrieve calculated TTL for a given complexity (useful for testing/headers).
   */
  getCalculatedTtlMs(complexity: number): number {
    if (complexity > this.complexityThreshold) {
      const ratio = (complexity - this.complexityThreshold) / this.complexityThreshold;
      const scalingFactor = 1 + ratio;
      return Math.min(Math.round(this.baseTtlMs * scalingFactor), this.maxTtlMs);
    }
    return this.baseTtlMs;
  }
}
