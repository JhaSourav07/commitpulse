// lib/cacheWarmer/scheduler.ts
import { PopularUserProfiler } from './profiler';
import { cache } from '@/lib/cache';

interface WarmCacheOptions {
  themes?: string[];
  force?: boolean;
}

export class CacheWarmerScheduler {
  private profiler: PopularUserProfiler;
  private defaultThemes = ['default', 'neon', 'dark', 'light', 'github'];
  private isWarming = false;

  constructor() {
    this.profiler = new PopularUserProfiler();
  }

  async warmCache(username: string, options: WarmCacheOptions = {}): Promise<void> {
    const themes = options.themes || this.defaultThemes;

    console.log(`🌡️ Warming cache for ${username} with themes: ${themes.join(', ')}`);

    const results = await Promise.allSettled(
      themes.map(async (theme) => {
        try {
          await this.generateAndCacheBadge(username, theme);
          console.log(`✅ Warmed ${username} with theme ${theme}`);
        } catch (error) {
          console.error(`❌ Failed to warm ${username} with theme ${theme}:`, error);
        }
      })
    );

    // Store warm status
    await cache.set(`warmed:${username}`, 'true', { ttl: 60 * 60 * 24 });
  }

  private async generateAndCacheBadge(username: string, theme: string): Promise<void> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/streak?user=${username}&theme=${theme}`, {
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY || 'dev'}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const svg = await response.text();

      const cacheKey = `badge:${username}:${theme}`;
      await cache.set(cacheKey, svg, { ttl: 60 * 60 * 24 * 7 });
    } catch (error) {
      console.error(`Failed to generate badge for ${username} with theme ${theme}:`, error);
      throw error;
    }
  }

  async runWarmupCycle(): Promise<void> {
    if (this.isWarming) {
      console.log('⚠️ Warmup cycle already running');
      return;
    }

    this.isWarming = true;
    console.log('🔄 Starting cache warmup cycle...');

    try {
      const topUsers = await this.profiler.getTopUsers(100);
      console.log(`📊 Warming cache for ${topUsers.length} users`);

      const batchSize = 10;
      for (let i = 0; i < topUsers.length; i += batchSize) {
        const batch = topUsers.slice(i, i + batchSize);
        await Promise.allSettled(batch.map((user) => this.warmCache(user.username)));
        console.log(
          `✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topUsers.length / batchSize)}`
        );

        if (i + batchSize < topUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      await cache.set('last_warmup', new Date().toISOString(), { ttl: 60 * 60 * 24 });

      console.log('✅ Cache warmup cycle completed successfully');
    } catch (error) {
      console.error('❌ Cache warmup cycle failed:', error);
    } finally {
      this.isWarming = false;
    }
  }

  async getWarmupStatus(username: string): Promise<boolean> {
    const status = await cache.get(`warmed:${username}`);
    return status === 'true';
  }
}
