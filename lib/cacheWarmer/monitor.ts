// lib/cacheWarmer/monitor.ts
import { cache } from '@/lib/cache';

interface CacheMetrics {
  username: string;
  cacheHits: number;
  cacheMisses: number;
  averageLatency: number;
  lastUpdated: Date;
}

export class CacheMonitor {
  async trackCacheHit(username: string, latency: number): Promise<void> {
    const key = `metrics:${username}`;
    const existing = await cache.get(key);
    const data = existing
      ? JSON.parse(existing)
      : {
          cacheHits: 0,
          cacheMisses: 0,
          totalLatency: 0,
          requestCount: 0,
          lastUpdated: new Date().toISOString(),
        };

    data.cacheHits += 1;
    data.totalLatency += latency;
    data.requestCount += 1;
    data.lastUpdated = new Date().toISOString();

    await cache.set(key, JSON.stringify(data), { ttl: 60 * 60 * 24 * 30 });
  }

  async trackCacheMiss(username: string): Promise<void> {
    const key = `metrics:${username}`;
    const existing = await cache.get(key);
    const data = existing
      ? JSON.parse(existing)
      : {
          cacheHits: 0,
          cacheMisses: 0,
          totalLatency: 0,
          requestCount: 0,
          lastUpdated: new Date().toISOString(),
        };

    data.cacheMisses += 1;
    data.requestCount += 1;
    data.lastUpdated = new Date().toISOString();

    await cache.set(key, JSON.stringify(data), { ttl: 60 * 60 * 24 * 30 });
  }

  async getMetrics(username: string): Promise<CacheMetrics | null> {
    const data = await cache.get(`metrics:${username}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    const totalRequests = parsed.cacheHits + parsed.cacheMisses;

    return {
      username,
      cacheHits: parsed.cacheHits || 0,
      cacheMisses: parsed.cacheMisses || 0,
      averageLatency: totalRequests > 0 ? parsed.totalLatency / totalRequests : 0,
      lastUpdated: new Date(parsed.lastUpdated || Date.now()),
    };
  }

  async getOverallStats(): Promise<{
    totalRequests: number;
    hitRate: number;
    averageLatency: number;
    topUsers: Array<{ username: string; requests: number }>;
  }> {
    const keys = await cache.keys('metrics:*');
    let totalHits = 0;
    let totalMisses = 0;
    let totalRequests = 0;
    let totalLatency = 0;
    const userStats: Array<{ username: string; requests: number }> = [];

    for (const key of keys) {
      const username = key.replace('metrics:', '');
      const data = await cache.get(key);
      if (!data) continue;

      const parsed = JSON.parse(data);
      const hits = parsed.cacheHits || 0;
      const misses = parsed.cacheMisses || 0;
      const latency = parsed.totalLatency || 0;
      const requests = parsed.requestCount || 0;

      totalHits += hits;
      totalMisses += misses;
      totalRequests += requests;
      totalLatency += latency;

      if (requests > 0) {
        userStats.push({ username, requests });
      }
    }

    return {
      totalRequests,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      topUsers: userStats.sort((a, b) => b.requests - a.requests).slice(0, 10),
    };
  }
}
