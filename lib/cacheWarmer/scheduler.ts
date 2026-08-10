import { fetchGitHubContributions } from '@/lib/github';
import { generateSVG } from '@/lib/svg/generator';
import { calculateStreak } from '@/lib/calculate';
import { getNormalizedThemeKey } from '@/lib/svg/themes';
import { DistributedCache } from '@/lib/cache';
import { profiler } from './profiler';
import { throttler } from './throttler';
import dbConnect from '@/lib/mongodb';
import { Watchlist } from '@/models/Watchlist';
import logger from '@/lib/logger';
import type { BadgeParams } from '@/types';

export const COMMON_WARM_THEMES = ['default', 'neon', 'dark', 'light'];

export class CacheWarmerScheduler {
  private cache = new DistributedCache<string>(500, 60000);

  /**
   * Pre-generates contribution data and badge SVGs for a single user across common theme variations.
   */
  async warmCache(username: string, themes: string[] = COMMON_WARM_THEMES): Promise<void> {
    if (!username || typeof username !== 'string') return;
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) return;

    try {
      // 1. Force refresh contribution data from GitHub API & cache it
      const contributionData = await fetchGitHubContributions(cleanUser, { forceRefresh: true });
      const stats = calculateStreak(contributionData.calendar);

      // 2. Pre-render & cache SVGs for each theme variation
      for (const themeName of themes) {
        try {
          const themeKey = getNormalizedThemeKey(themeName);
          const params: BadgeParams = {
            user: cleanUser,
            theme: themeKey,
            view: 'default',
          };
          const svg = generateSVG(stats, params, contributionData.calendar);
          const cacheKey = `badge:svg:${cleanUser}:${themeKey}`;
          await this.cache.set(cacheKey, svg, 24 * 60 * 60 * 1000); // 24 hours
        } catch (svgErr) {
          logger.warn(`Failed to pre-render SVG for ${cleanUser} with theme ${themeName}`, {
            error: svgErr instanceof Error ? svgErr.message : String(svgErr),
          });
        }
      }

      logger.info(`Successfully warmed cache for user: ${cleanUser}`, { themes });
    } catch (err) {
      logger.error(`CacheWarmerScheduler failed to warm cache for user ${cleanUser}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Runs a complete cache warmup cycle for top trending users and watchlist subscribers.
   */
  async runWarmupCycle(
    limit: number = 100
  ): Promise<{ warmedCount: number; durationMs: number; users: string[] }> {
    const startTime = Date.now();
    logger.info('Starting scheduled cache warmup cycle...');

    // Fetch top users from profiling engine
    const topUsers = await profiler.getTopUsers(limit);
    const userSet = new Set<string>(topUsers.map((u) => u.username.toLowerCase()));

    // Fetch watchlist subscribers
    try {
      if (process.env.MONGODB_URI) {
        await dbConnect();
        const watchlistDocs = await Watchlist.find({}).lean();
        for (const doc of watchlistDocs) {
          userSet.add(doc.username.toLowerCase());
        }
      }
    } catch (err) {
      logger.warn('CacheWarmerScheduler failed to query Watchlist for warmup cycle', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const usersToWarm = Array.from(userSet);

    // Warm cache for all users using throttler
    await throttler.warmWithThrottling(usersToWarm, {
      customWarmFn: async (username) => {
        await this.warmCache(username);
      },
    });

    const durationMs = Date.now() - startTime;
    logger.info('Completed scheduled cache warmup cycle', {
      warmedCount: usersToWarm.length,
      durationMs,
    });

    return {
      warmedCount: usersToWarm.length,
      durationMs,
      users: usersToWarm,
    };
  }
}

export const cacheWarmer = new CacheWarmerScheduler();
