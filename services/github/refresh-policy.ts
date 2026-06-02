import { quotaMonitor } from './quota-monitor';
import { TTLCache } from '../../lib/cache';

export class RefreshPolicy {
  private static instance: RefreshPolicy;

  // Cooldown in milliseconds (default 5 minutes)
  private cooldownMs = 5 * 60 * 1000;

  // Cache of username -> last successful refresh timestamp
  private refreshTimes = new TTLCache<number>(5000, 60 * 60 * 1000);

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
   * Returns whether a refresh is permitted for the given username.
   *
   * A refresh is allowed if:
   * 1. The username has not been refreshed within the cooldown window.
   * 2. The global GitHub API token quota is not low.
   */
  public isRefreshAllowed(username: string): boolean {
    const sanitized = username.trim().toLowerCase();

    // 1. Check if global quota is dangerously low
    if (quotaMonitor.isQuotaLow()) {
      return false;
    }

    // 2. When cooldown is 0, always allow immediately
    if (this.cooldownMs === 0) {
      return true;
    }

    // 3. Check per-username cooldown (use fallback key for empty usernames)
    const cacheKey = sanitized === '' ? '__anonymous__' : sanitized;
    const lastRefresh = this.refreshTimes.get(cacheKey);
    if (!lastRefresh) {
      return true;
    }

    return Date.now() - lastRefresh >= this.cooldownMs;
  }

  /**
   * Records a successful refresh event for the username.
   */
  public recordRefresh(username: string): void {
    const sanitized = username.trim().toLowerCase();
    // When cooldownMs is 0 there is nothing to enforce, skip the write
    // (TTLCache rejects ttlMs <= 0). Use a fallback key for empty usernames.
    if (this.cooldownMs > 0) {
      const cacheKey = sanitized === '' ? '__anonymous__' : sanitized;
      this.refreshTimes.set(cacheKey, Date.now(), this.cooldownMs);
    }
    quotaMonitor.incrementRefreshCount();
  }

  /**
   * Gets the remaining cooldown time in milliseconds for a username.
   * Returns 0 if no cooldown is active.
   */
  public getRemainingCooldown(username: string): number {
    const sanitized = username.trim().toLowerCase();
    const cacheKey = sanitized === '' ? '__anonymous__' : sanitized;
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
    this.cooldownMs = 5 * 60 * 1000;
  }
}

export const refreshPolicy = RefreshPolicy.getInstance();
export default refreshPolicy;
