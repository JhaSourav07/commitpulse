// lib/cacheWarmer/profiler.ts
import { cache } from '@/lib/cache';

export interface UserProfile {
  username: string;
  requestFrequency: number;
  lastRequestTime: Date;
  trendingScore: number;
  totalContributions: number;
  reposCount: number;
}

export class PopularUserProfiler {
  async getTopUsers(limit: number = 100): Promise<UserProfile[]> {
    // Get all users from cache
    const keys = await cache.keys('user:requests:*');
    const users = keys.map((k) => k.replace('user:requests:', ''));

    if (users.length === 0) {
      // Fallback to some popular users if no data
      return this.getDefaultUsers(limit);
    }

    const profiles = await Promise.all(
      users.map(async (username) => {
        try {
          const requestData = await this.getRequestData(username);
          const contributionData = await this.getUserStats(username);

          return {
            username,
            requestFrequency: (requestData?.count || 0) / 30,
            lastRequestTime: new Date(requestData?.lastRequest || Date.now()),
            totalContributions: contributionData.total || 0,
            reposCount: contributionData.repos || 0,
            trendingScore: this.calculateScore({
              requestFrequency: (requestData?.count || 0) / 30,
              recency: await this.getRecencyScore(username),
              contributions: contributionData.total || 0,
              communityImpact: contributionData.repos || 0,
            }),
          };
        } catch (error) {
          console.error(`Error processing ${username}:`, error);
          return null;
        }
      })
    );

    return profiles
      .filter((p): p is UserProfile => p !== null)
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  private getDefaultUsers(limit: number): UserProfile[] {
    const defaultUsers = [
      'jhasourav07',
      'muskan-yadav18',
      'ArshiBansal',
      'souravjhahind',
      'BhakktiGautam',
    ];

    return defaultUsers.slice(0, limit).map((username) => ({
      username,
      requestFrequency: 10,
      lastRequestTime: new Date(),
      trendingScore: 50,
      totalContributions: 100,
      reposCount: 5,
    }));
  }

  private async getRequestData(
    username: string
  ): Promise<{ count: number; dates: string[]; lastRequest: string } | null> {
    const key = `user:requests:${username}`;
    const data = await cache.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async trackUserRequest(username: string): Promise<void> {
    const key = `user:requests:${username}`;
    const existing = await cache.get(key);
    const data = existing
      ? JSON.parse(existing)
      : { count: 0, dates: [], lastRequest: new Date().toISOString() };

    data.count += 1;
    data.dates.push(new Date().toISOString());
    data.lastRequest = new Date().toISOString();

    // Keep only last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    data.dates = data.dates.filter((d: string) => new Date(d) > cutoff);

    await cache.set(key, JSON.stringify(data), { ttl: 60 * 60 * 24 * 30 });
  }

  private async getRecencyScore(username: string): Promise<number> {
    const data = await this.getRequestData(username);
    if (!data || data.dates.length === 0) return 0;

    const now = new Date();
    const lastDay = data.dates.filter((d) => {
      const date = new Date(d);
      return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
    }).length;

    const lastWeek = data.dates.filter((d) => {
      const date = new Date(d);
      return now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return Math.min(lastDay / 10 + lastWeek / 70, 1);
  }

  private async getUserStats(username: string): Promise<{ total: number; repos: number }> {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });

      if (!response.ok) return { total: 0, repos: 0 };

      const data = await response.json();
      return {
        total: data.public_repos || 0,
        repos: data.public_repos || 0,
      };
    } catch {
      return { total: 0, repos: 0 };
    }
  }

  private calculateScore(metrics: {
    requestFrequency: number;
    recency: number;
    contributions: number;
    communityImpact: number;
  }): number {
    return (
      metrics.requestFrequency * 0.4 +
      metrics.recency * 0.3 +
      Math.min(metrics.contributions / 1000, 1) * 0.2 +
      Math.min(metrics.communityImpact / 50, 1) * 0.1
    );
  }
}
