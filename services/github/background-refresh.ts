import 'server-only';
import { getFullDashboardData } from '../../lib/github';
import { syncQueue } from '../../lib/syncQueue';
import { DistributedCache } from '../../lib/cache';
import { randomUUID } from 'crypto';

// Cache is considered stale and candidate for background refresh after 10 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

// Lock expires automatically after 5 minutes
const LOCK_TTL_MS = 5 * 60 * 1000;

const refreshLocksCache = new DistributedCache<number>(10000, LOCK_TTL_MS);

export class BackgroundRefresh {
  private static instance: BackgroundRefresh;
  private activeTokens = new Map<string, string>();

  private constructor() {}

  public static getInstance(): BackgroundRefresh {
    if (!BackgroundRefresh.instance) {
      BackgroundRefresh.instance = new BackgroundRefresh();
    }

    return BackgroundRefresh.instance;
  }

  /**
   * Checks whether a cached entry is stale and should trigger an async background update.
   */
  public isStale(lastSyncedAt: string | undefined): boolean {
    if (!lastSyncedAt) return true;

    try {
      const lastSyncTime = new Date(lastSyncedAt).getTime();

      if (isNaN(lastSyncTime)) return true;

      return Date.now() - lastSyncTime > STALE_THRESHOLD_MS;
    } catch {
      return true;
    }
  }

  /**
   * Generates normalized lock key.
   */
  private createLockKey(username: string): string {
    return `bg_refresh_lock:${username.trim().toLowerCase()}`;
  }

  /**
   * Attempts to acquire refresh lock.
   */
  private async acquireLock(username: string): Promise<boolean> {
    const key = this.createLockKey(username);
    const token = randomUUID();
    const acquired = await refreshLocksCache.acquireTokenLock(key, token, LOCK_TTL_MS);
    if (acquired) {
      this.activeTokens.set(key, token);
    }
    return acquired;
  }

  /**
   * Releases refresh lock.
   */
  private async releaseLock(username: string): Promise<void> {
    const key = this.createLockKey(username);
    const token = this.activeTokens.get(key);
    if (token) {
      await refreshLocksCache.releaseTokenLock(key, token);
      this.activeTokens.delete(key);
    }
  }

  /**
   * Triggers asynchronous cache refresh.
   */
  public async triggerRefresh(username: string): Promise<void> {
    const sanitized = username.trim().toLowerCase();

    const acquired = await this.acquireLock(sanitized);

    if (!acquired) {
      console.info(`[BackgroundRefresh] Refresh already active for: ${sanitized}`);
      return;
    }

    console.info(`[BackgroundRefresh] Queuing background refresh for: ${sanitized}`);

    return new Promise((resolve) => {
      syncQueue.enqueue(async () => {
        try {
          await getFullDashboardData(sanitized, { forceRefresh: true });
          console.info(
            `[BackgroundRefresh] Successfully completed background refresh for: ${sanitized}`
          );
        } catch (err) {
          console.error(`[BackgroundRefresh] Background refresh failed for: ${sanitized}`, err);
        } finally {
          await this.releaseLock(sanitized);
          resolve();
        }
      });
    });
  }

  /**
   * Returns whether a job is active.
   */
  public async isJobActive(username: string): Promise<boolean> {
    const key = this.createLockKey(username);
    return await refreshLocksCache.has(key);
  }

  /**
   * Clears locks.
   */
  public reset(): void {
    refreshLocksCache.clear();
    this.activeTokens.clear();
  }
}

export const backgroundRefresh = BackgroundRefresh.getInstance();

export default backgroundRefresh;
