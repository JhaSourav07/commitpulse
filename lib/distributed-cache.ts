import 'server-only';

/**
 * lib/distributed-cache.ts
 *
 * Distributed cache layer using Redis for TTL cache shared across instances.
 * Prevents data inconsistency in distributed deployments.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<number>;
  flushdb(): Promise<void>;
}

export class DistributedCache {
  private redisClient: RedisClient | null;
  private ttlMs: number;

  constructor(redisClient: RedisClient | null, ttlMs: number = 3600000) {
    this.redisClient = redisClient;
    this.ttlMs = ttlMs;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const value = await this.redisClient.get(key);
      if (!value) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(value);
      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const expiryTime = ttlMs || this.ttlMs;
      const entry: CacheEntry<T> = {
        data,
        expiresAt: Date.now() + expiryTime,
        createdAt: Date.now(),
      };

      await this.redisClient.setex(key, Math.ceil(expiryTime / 1000), JSON.stringify(entry));
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export function createDistributedCache(redisClient: RedisClient | null): DistributedCache {
  return new DistributedCache(redisClient);
}
