import { getFullDashboardData } from '../../lib/github';

// Cache is considered stale and candidate for background refresh after 10 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

export class BackgroundRefresh {
  private static instance: BackgroundRefresh;

  private activeJobs = new Set<string>();

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
      return Date.now() - lastSyncTime > STALE_THRESHOLD_MS;
    } catch {
      return true;
    }
  }

  /**
   * Triggers an asynchronous, non-blocking cache backfill for the given username.
   */
  public triggerRefresh(username: string): void {
    const sanitized = username.trim().toLowerCase();

    // Avoid duplicate background jobs for the same user concurrently
    if (this.activeJobs.has(sanitized)) {
      return;
    }

    this.activeJobs.add(sanitized);

    console.info(`[BackgroundRefresh] Starting background refresh for: ${sanitized}`);

    // Trigger update asynchronously (non-blocking Promise execution)
    getFullDashboardData(username, { bypassCache: true })
      .then(() => {
        console.info(
          `[BackgroundRefresh] Successfully completed background refresh for: ${sanitized}`
        );
      })
      .catch((err) => {
        console.error(`[BackgroundRefresh] Background refresh failed for: ${sanitized}`, err);
      })
      .finally(() => {
        this.activeJobs.delete(sanitized);
      });
  }

  /**
   * Returns whether a background job is currently active for a username.
   */
  public isJobActive(username: string): boolean {
    return this.activeJobs.has(username.trim().toLowerCase());
  }

  /**
   * Resets active jobs.
   */
  public reset(): void {
    this.activeJobs.clear();
  }
}

export const backgroundRefresh = BackgroundRefresh.getInstance();
export default backgroundRefresh;
