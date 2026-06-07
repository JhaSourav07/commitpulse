import { gitHubUserValidator } from '../github/validate-user';
import { TTLCache } from '../../lib/cache';

// GitHub username rules: alphanumeric or single hyphens, max 39 chars, cannot start/end with hyphen
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

// 5 minutes write cooldown to deduplicate writes/updates
const WRITE_COOLDOWN_MS = 5 * 60 * 1000;

export class TrackUserProtection {
  private static instance: TrackUserProtection;

  // Cache of username -> last database write timestamp
  private lastWriteTimes = new TTLCache<number>(5000, 60 * 60 * 1000);

  private constructor() {}

  public static getInstance(): TrackUserProtection {
    if (!TrackUserProtection.instance) {
      TrackUserProtection.instance = new TrackUserProtection();
    }
    return TrackUserProtection.instance;
  }

  /**
   * Validates if the username format complies with official GitHub conventions.
   * Prevents random UUIDs/junk injections before any API/DB calls are triggered.
   */
  public validateFormat(username: string): boolean {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length > 39) {
      return false;
    }
    return GITHUB_USERNAME_REGEX.test(trimmed);
  }

  /**
   * Checks if a database write is allowed for the username based on cooldown.
   * Prevents spam updates/concurrency write spikes for the same user.
   */
  public isWriteAllowed(username: string): boolean {
    const sanitized = username.trim().toLowerCase();
    const lastWrite = this.lastWriteTimes.get(sanitized);
    if (!lastWrite) {
      return true;
    }
    return Date.now() - lastWrite >= WRITE_COOLDOWN_MS;
  }

  /**
   * Records a successful database write event for the username.
   */
  public recordWrite(username: string): void {
    const sanitized = username.trim().toLowerCase();
    this.lastWriteTimes.set(sanitized, Date.now(), WRITE_COOLDOWN_MS);
  }

  /**
   * Coordinates both format, cooldown, and existence checks.
   */
  public async verifyAndDeduplicate(username: string): Promise<{
    allowed: boolean;
    reason?: 'INVALID_FORMAT' | 'COOLDOWN_ACTIVE' | 'USER_NOT_FOUND';
    remainingMs?: number;
  }> {
    // 1. Verify format
    if (!this.validateFormat(username)) {
      return { allowed: false, reason: 'INVALID_FORMAT' };
    }

    const sanitized = username.trim().toLowerCase();

    // 2. Check cooldown deduplication
    if (!this.isWriteAllowed(sanitized)) {
      const lastWrite = this.lastWriteTimes.get(sanitized) || 0;
      const remainingMs = Math.max(0, WRITE_COOLDOWN_MS - (Date.now() - lastWrite));
      return { allowed: false, reason: 'COOLDOWN_ACTIVE', remainingMs };
    }

    // 3. Verify user exists on GitHub
    const exists = await gitHubUserValidator.validateUser(username);
    if (!exists) {
      return { allowed: false, reason: 'USER_NOT_FOUND' };
    }

    return { allowed: true };
  }

  /**
   * Resets active writes map (useful for testing).
   */
  public reset(): void {
    this.lastWriteTimes.clear();
  }
}

export const trackUserProtection = TrackUserProtection.getInstance();
export default trackUserProtection;
