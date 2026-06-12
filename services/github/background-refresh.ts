import { getFullDashboardData } from '../../lib/github';
import { syncQueue } from '../../lib/syncQueue';

// Cache is considered stale and candidate for background refresh after 10 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

// Lock expires automatically after 5 minutes
const LOCK_TTL_MS = 5 * 60 * 1000;

type GlobalWithLocks = typeof globalThis & {
  __backgroundRefreshLocks?: Map<
    string,
    {
      expiresAt: number;
    }
  >;
};

const globalLocks =
  (globalThis as GlobalWithLocks).__backgroundRefreshLocks ??
  new Map<string, { expiresAt: number }>();

(globalThis as GlobalWithLocks).__backgroundRefreshLocks = globalLocks;

export class BackgroundRefresh {
  private static instance: BackgroundRefresh;

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
    return username.trim().toLowerCase();
  }

  /**
   * Attempts to acquire refresh lock.
   */
  private acquireLock(username: string): boolean {
    const key = this.createLockKey(username);

    const existing = globalLocks.get(key);

    if (existing && existing.expiresAt > Date.now()) {
      return false;
    }

    globalLocks.set(key, {
      expiresAt: Date.now() + LOCK_TTL_MS,
    });

    return true;
  }

  /**
   * Releases refresh lock.
   */
  private releaseLock(username: string): void {
    const key = this.createLockKey(username);

    globalLocks.delete(key);
  }

  /**
   * Triggers asynchronous cache refresh.
   */
  public async triggerRefresh(username: string): Promise<void> {
    const sanitized = username.trim().toLowerCase();

    const acquired = this.acquireLock(sanitized);

    if (!acquired) {
      console.info(`[BackgroundRefresh] Refresh already active for: ${sanitized}`);

      return;
    }

    console.info(`[BackgroundRefresh] Queuing background refresh for: ${sanitized}`);

    return new Promise((resolve) => {
      syncQueue.enqueue(async () => {
        try {
          await getFullDashboardData(username, { forceRefresh: true });
          console.info(
            `[BackgroundRefresh] Successfully completed background refresh for: ${sanitized}`
          );
        } catch (err) {
          console.error(`[BackgroundRefresh] Background refresh failed for: ${sanitized}`, err);
        } finally {
          this.releaseLock(sanitized);
          resolve();
        }
      });
    });
  }

  /**
   * Returns whether a job is active.
   */
  public isJobActive(username: string): boolean {
    const key = this.createLockKey(username);

    const existing = globalLocks.get(key);

    if (!existing) {
      return false;
    }

    if (existing.expiresAt <= Date.now()) {
      globalLocks.delete(key);

      return false;
    }

    return true;
  }

  /**
   * Clears locks.
   */
  public reset(): void {
    globalLocks.clear();
  }
}

export const backgroundRefresh = BackgroundRefresh.getInstance();

export default backgroundRefresh;
