import dbConnect from '@/lib/mongodb';
import { CacheMetrics } from '@/models/CacheMetrics';
import { Watchlist } from '@/models/Watchlist';
import logger from '@/lib/logger';

export interface UserProfile {
  username: string;
  requestFrequency: number; // Requests per day
  lastRequestTime: Date;
  trendingScore: number; // Weighted combination (0 to 100 or 0 to 1 scale)
  cacheHits?: number;
  cacheMisses?: number;
  averageLatency?: number;
}

interface InternalMetrics {
  username: string;
  requestCount: number;
  lastRequest: Date;
  cacheHits: number;
  cacheMisses: number;
  averageLatency: number;
  firstRequest: Date;
}

export class PopularUserProfiler {
  private inMemoryMetrics = new Map<string, InternalMetrics>();

  /**
   * Record a request for profiling and analytics tracking.
   */
  async recordRequest(username: string, latencyMs: number, hit: boolean): Promise<void> {
    if (!username || typeof username !== 'string') return;
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) return;

    const now = new Date();

    // Update in-memory metrics
    const existingMemory = this.inMemoryMetrics.get(cleanUser) || {
      username: cleanUser,
      requestCount: 0,
      lastRequest: now,
      cacheHits: 0,
      cacheMisses: 0,
      averageLatency: 0,
      firstRequest: now,
    };

    const newCount = existingMemory.requestCount + 1;
    const newHits = existingMemory.cacheHits + (hit ? 1 : 0);
    const newMisses = existingMemory.cacheMisses + (hit ? 0 : 1);
    const newAvgLatency = Math.round(
      (existingMemory.averageLatency * existingMemory.requestCount + latencyMs) / newCount
    );

    const updatedMemory: InternalMetrics = {
      username: cleanUser,
      requestCount: newCount,
      lastRequest: now,
      cacheHits: newHits,
      cacheMisses: newMisses,
      averageLatency: newAvgLatency,
      firstRequest: existingMemory.firstRequest,
    };
    this.inMemoryMetrics.set(cleanUser, updatedMemory);

    // Attempt MongoDB update if database is available
    try {
      if (process.env.MONGODB_URI) {
        await dbConnect();
        await CacheMetrics.findOneAndUpdate(
          { username: cleanUser },
          {
            $inc: {
              requestCount: 1,
              cacheHits: hit ? 1 : 0,
              cacheMisses: hit ? 0 : 1,
            },
            $set: {
              lastRequest: now,
              averageLatency: newAvgLatency,
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      logger.warn('PopularUserProfiler failed to persist request to MongoDB', {
        username: cleanUser,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Analyzes request patterns and ranks users by trending score.
   * Weight breakdown:
   * - Request frequency (40%)
   * - Recency of requests (30%)
   * - GitHub activity / Request volume (20%)
   * - Community contributions / Watchlist status (10%)
   */
  async getTopUsers(limit: number = 100): Promise<UserProfile[]> {
    const metricsMap = new Map<string, InternalMetrics>();

    // Copy in-memory metrics first
    for (const [user, m] of this.inMemoryMetrics.entries()) {
      metricsMap.set(user, { ...m });
    }

    const watchlistUsers = new Set<string>();

    // Query MongoDB if available
    try {
      if (process.env.MONGODB_URI) {
        await dbConnect();
        const dbMetrics = await CacheMetrics.find({}).lean();
        for (const doc of dbMetrics) {
          const user = doc.username.toLowerCase();
          const existing = metricsMap.get(user);
          if (!existing) {
            metricsMap.set(user, {
              username: user,
              requestCount: doc.requestCount || 0,
              lastRequest: doc.lastRequest || new Date(),
              cacheHits: doc.cacheHits || 0,
              cacheMisses: doc.cacheMisses || 0,
              averageLatency: doc.averageLatency || 0,
              firstRequest:
                (doc as unknown as { createdAt?: Date }).createdAt || doc.lastRequest || new Date(),
            });
          } else {
            // Combine with DB metrics
            existing.requestCount = Math.max(existing.requestCount, doc.requestCount || 0);
            existing.cacheHits = Math.max(existing.cacheHits, doc.cacheHits || 0);
            existing.cacheMisses = Math.max(existing.cacheMisses, doc.cacheMisses || 0);
            if (doc.lastRequest && doc.lastRequest > existing.lastRequest) {
              existing.lastRequest = doc.lastRequest;
            }
          }
        }

        const watchlistDocs = await Watchlist.find({}).lean();
        for (const w of watchlistDocs) {
          watchlistUsers.add(w.username.toLowerCase());
        }
      }
    } catch (err) {
      logger.warn('PopularUserProfiler failed to query MongoDB, using in-memory store', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (metricsMap.size === 0) {
      return [];
    }

    const now = Date.now();
    const rawProfiles: {
      profile: UserProfile;
      rawFrequency: number;
      rawVolume: number;
      recencyScore: number;
      communityScore: number;
    }[] = [];

    let maxFrequency = 1;
    let maxVolume = 1;

    for (const metrics of metricsMap.values()) {
      const hoursSinceLastRequest = Math.max(
        0,
        (now - new Date(metrics.lastRequest).getTime()) / (1000 * 60 * 60)
      );
      const daysActive = Math.max(
        1,
        (now - new Date(metrics.firstRequest).getTime()) / (1000 * 60 * 60 * 24)
      );
      const requestFrequency = metrics.requestCount / daysActive; // Requests per day

      if (requestFrequency > maxFrequency) maxFrequency = requestFrequency;
      if (metrics.requestCount > maxVolume) maxVolume = metrics.requestCount;

      // Recency score decays over hours: 1 / (1 + hours / 24)
      const recencyScore = 1 / (1 + hoursSinceLastRequest / 24);

      // Community / Watchlist score: 1.0 if subscribed to watchlist, 0.0 otherwise
      const communityScore = watchlistUsers.has(metrics.username) ? 1.0 : 0.0;

      rawProfiles.push({
        profile: {
          username: metrics.username,
          requestFrequency: Math.round(requestFrequency * 100) / 100,
          lastRequestTime: metrics.lastRequest,
          trendingScore: 0,
          cacheHits: metrics.cacheHits,
          cacheMisses: metrics.cacheMisses,
          averageLatency: metrics.averageLatency,
        },
        rawFrequency: requestFrequency,
        rawVolume: metrics.requestCount,
        recencyScore,
        communityScore,
      });
    }

    // Calculate final weighted trendingScore normalized to 0 - 100
    const scoredProfiles = rawProfiles.map((item) => {
      const frequencyNorm = item.rawFrequency / maxFrequency; // 40%
      const recencyNorm = item.recencyScore; // 30%
      const volumeNorm = item.rawVolume / maxVolume; // 20%
      const communityNorm = item.communityScore; // 10%

      const score =
        (frequencyNorm * 0.4 + recencyNorm * 0.3 + volumeNorm * 0.2 + communityNorm * 0.1) * 100;

      item.profile.trendingScore = Math.round(score * 100) / 100;
      return item.profile;
    });

    // Sort descending by trendingScore
    scoredProfiles.sort((a, b) => b.trendingScore - a.trendingScore);

    return scoredProfiles.slice(0, Math.max(1, limit));
  }

  /**
   * Reset in-memory store (useful for tests).
   */
  clearInMemoryStore(): void {
    this.inMemoryMetrics.clear();
  }
}

export const profiler = new PopularUserProfiler();
