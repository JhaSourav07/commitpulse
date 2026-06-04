import { fetchUserProfile } from '../../lib/github';
import { TTLCache } from '../../lib/cache';

// 24-hour validation cache
const VALIDATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class GitHubUserValidator {
  private static instance: GitHubUserValidator;

  // Cache stores username -> boolean existence status
  private cache = new TTLCache<boolean>(5000, 60 * 60 * 1000);

  private constructor() {}

  public static getInstance(): GitHubUserValidator {
    if (!GitHubUserValidator.instance) {
      GitHubUserValidator.instance = new GitHubUserValidator();
    }
    return GitHubUserValidator.instance;
  }

  /**
   * Validates if the username represents a real, existing GitHub user.
   * Results are cached for 24 hours to reduce API call overhead.
   */
  public async validateUser(username: string): Promise<boolean> {
    const sanitized = username.trim().toLowerCase();

    // Check cache first
    const cachedStatus = this.cache.get(sanitized);
    if (cachedStatus !== null) {
      return cachedStatus;
    }

    try {
      // Query the GitHub profile endpoint
      await fetchUserProfile(username, { bypassCache: false });

      // User exists! Cache the result
      this.cache.set(sanitized, true, VALIDATION_CACHE_TTL_MS);
      return true;
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : '';

      if (errMessage.includes('User not found') || errMessage.includes('not found')) {
        // User does not exist. Cache the negative result as well to prevent brute force abuse
        this.cache.set(sanitized, false, VALIDATION_CACHE_TTL_MS);
        return false;
      }

      // For temporary API errors/rate limits, do not cache the failure permanently
      throw err;
    }
  }

  /**
   * Clears the validation cache (useful for tests).
   */
  public reset(): void {
    this.cache.clear();
  }
}

export const gitHubUserValidator = GitHubUserValidator.getInstance();
export default gitHubUserValidator;
