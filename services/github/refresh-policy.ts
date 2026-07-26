import 'server-only';
import { quotaMonitor } from './quota-monitor';
import { TTLCache } from '../../lib/cache';

export class RefreshPolicy {
  private static instance: RefreshPolicy;

  // Cooldown in milliseconds (default 30 seconds)
  private cooldownMs = 30 * 1000;

  // Cache of username -> last successful refresh timestamp (15,000 capacity)
  private refreshTimes = new TTLCache<number>(15000, 60 * 60 * 1000);

  private constructor() {}

  public static getInstance(): RefreshPolicy {
    if (!RefreshPolicy.instance) {
      RefreshPolicy.instance = new RefreshPolicy();
    }
    return RefreshPolicy.instance;
  }

  /**
   * Set custom cooldown duration in milliseconds.
   */
  public setCooldown(ms: number): void {
    this.cooldownMs = Math.max(0, ms);
  }

  /**
   * Maps username to a safe cache key, hashing extremely long usernames
   * to avoid length limits in TTLCache.
   */
  private getCacheKey(username: string): string {
    const sanitized = username.trim().toLowerCase();
    const key = sanitized === '' ? '__anonymous__' : sanitized;
    if (key.length > 10000) {
      let hash = 5381;
      for (let i = 0; i < key.length; i++) {
        hash = (hash * 33) ^ key.charCodeAt(i);
      }
      return `${key.slice(0, 1000)}_${(hash >>> 0).toString(16)}`;
    }
    return key;
  }

  /**
   * Returns whether a refresh is permitted for the given username.
   *
   * A refresh is allowed if:
   * 1. The username has not been refreshed within the cooldown window.
   * 2. The global GitHub API token quota is not low.
   */
  public isRefreshAllowed(username: string): boolean {
    // 1. Check if global quota is dangerously low
    if (quotaMonitor.isQuotaLow()) {
      return false;
    }

    // 2. When cooldown is 0, always allow immediately
    if (this.cooldownMs === 0) {
      return true;
    }

    // 3. Check per-username cooldown
    const cacheKey = this.getCacheKey(username);
    const lastRefresh = this.refreshTimes.get(cacheKey);
    if (!lastRefresh) {
      return true;
    }

    return Date.now() - lastRefresh >= this.cooldownMs;
  }

  /**
   * Atomically checks whether a refresh is allowed and, if so, records it.
   *
   * This eliminates the TOCTOU race condition between `isRefreshAllowed()`
   * and `recordRefresh()` where concurrent requests could all pass the
   * cooldown check before any of them recorded the refresh.
   *
   * @returns `true` if the refresh was allowed and recorded; `false` if blocked.
   */
  public tryAcquire(username: string): boolean {
    if (!this.isRefreshAllowed(username)) {
      return false;
    }

    // Record immediately to close the race window
    this.recordRefresh(username);
    return true;
  }

  /**
   * Records a successful refresh event for the username.
   */
  public recordRefresh(username: string): void {
    // When cooldownMs is 0 there is nothing to enforce, skip the write
    // (TTLCache rejects ttlMs <= 0).
    if (this.cooldownMs > 0) {
      const cacheKey = this.getCacheKey(username);
      // Store with a long TTL (1 hour) to allow dynamic cooldown increases later.
      this.refreshTimes.set(cacheKey, Date.now(), 60 * 60 * 1000);
    }
    quotaMonitor.incrementRefreshCount();
  }

  /**
   * Gets the remaining cooldown time in milliseconds for a username.
   * Returns 0 if no cooldown is active.
   */
  public getRemainingCooldown(username: string): number {
    const cacheKey = this.getCacheKey(username);
    const lastRefresh = this.refreshTimes.get(cacheKey);
    if (!lastRefresh) {
      return 0;
    }

    const elapsed = Date.now() - lastRefresh;
    return Math.max(0, this.cooldownMs - elapsed);
  }

  /**
   * Clears the refresh times map (useful for testing).
   */
  public reset(): void {
    this.refreshTimes.clear();
    this.cooldownMs = 30 * 1000;
  }
}

export const refreshPolicy = RefreshPolicy.getInstance();
export default refreshPolicy;
