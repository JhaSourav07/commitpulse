import { quotaMonitor } from './quota-monitor';

export class RefreshPolicy {
  private static instance: RefreshPolicy;

  // Cooldown in milliseconds (default 5 minutes)
  private cooldownMs = 5 * 60 * 1000;

  // Map of username -> last successful refresh timestamp
  private refreshTimes = new Map<string, number>();

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

    // 2. Check per-username cooldown
    const lastRefresh = this.refreshTimes.get(sanitized);
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
    this.refreshTimes.set(sanitized, Date.now());
    quotaMonitor.incrementRefreshCount();
  }

  /**
   * Gets the remaining cooldown time in milliseconds for a username.
   * Returns 0 if no cooldown is active.
   */
  public getRemainingCooldown(username: string): number {
    const sanitized = username.trim().toLowerCase();
    const lastRefresh = this.refreshTimes.get(sanitized);
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
