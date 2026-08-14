import { getGitHubTokens, getJitteredBackoff } from '@/lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';
import logger from '@/lib/logger';
import pLimit from 'p-limit';

export interface ThrottlerOptions {
  concurrency?: number;
  maxRetries?: number;
  delayBetweenUsersMs?: number;
  customWarmFn?: (username: string, token?: string) => Promise<void>;
}

export class Throttler {
  private gitHubTokenPool: string[];
  private rateLimitState: Map<string, number> = new Map();
  private currentTokenIndex: number = 0;

  constructor(customTokenPool?: string[]) {
    this.gitHubTokenPool = customTokenPool ?? getGitHubTokens();
  }

  /**
   * Refreshes the GitHub token pool from environment/configuration.
   */
  refreshTokenPool(): void {
    this.gitHubTokenPool = getGitHubTokens();
  }

  /**
   * Gets the next active GitHub token from the pool that is not currently rate-limited.
   */
  private getNextAvailableToken(): { token: string | undefined; tokenIndex: number } {
    if (this.gitHubTokenPool.length === 0) {
      return { token: undefined, tokenIndex: -1 };
    }

    const now = Date.now();
    for (let i = 0; i < this.gitHubTokenPool.length; i++) {
      const idx = (this.currentTokenIndex + i) % this.gitHubTokenPool.length;
      const token = this.gitHubTokenPool[idx];
      const blockedUntil = this.rateLimitState.get(token) || 0;

      if (now >= blockedUntil) {
        this.currentTokenIndex = (idx + 1) % this.gitHubTokenPool.length;
        return { token, tokenIndex: idx };
      }
    }

    // All tokens rate-limited, return current index anyway
    const fallbackIdx = this.currentTokenIndex;
    const token = this.gitHubTokenPool[fallbackIdx];
    this.currentTokenIndex = (fallbackIdx + 1) % this.gitHubTokenPool.length;
    return { token, tokenIndex: fallbackIdx };
  }

  /**
   * Warms cache for a list of users with multi-token rotation, rate limit awareness,
   * concurrency control, and exponential backoff on secondary rate limits.
   */
  async warmWithThrottling(users: string[], options: ThrottlerOptions = {}): Promise<void> {
    if (!users || users.length === 0) return;

    this.refreshTokenPool();

    const concurrency =
      options.concurrency ?? Math.max(1, Math.min(5, this.gitHubTokenPool.length || 2));
    const maxRetries = options.maxRetries ?? 3;
    const limit = pLimit(concurrency);

    const warmUser = async (username: string): Promise<void> => {
      let attempt = 0;
      let success = false;

      while (attempt <= maxRetries && !success) {
        // Check global quota monitor
        if (quotaMonitor.isQuotaLow()) {
          logger.warn('Throttler pausing warmup: GitHub API quota is low', { username });
          break;
        }

        const { token } = this.getNextAvailableToken();

        try {
          if (options.customWarmFn) {
            await options.customWarmFn(username, token);
          } else {
            // Default placeholder or execution handled by caller
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          success = true;
        } catch (err: unknown) {
          attempt++;
          const message = err instanceof Error ? err.message : String(err);
          const isRateLimit =
            message.includes('429') ||
            message.toLowerCase().includes('rate limit') ||
            message.toLowerCase().includes('secondary rate limit');

          if (token && isRateLimit) {
            // Block token for 60 seconds
            this.rateLimitState.set(token, Date.now() + 60000);
          }

          if (attempt <= maxRetries) {
            const backoffMs = getJitteredBackoff(attempt - 1);
            logger.warn(
              `Throttler retrying user ${username} (attempt ${attempt}/${maxRetries}) after ${backoffMs}ms`,
              {
                error: message,
              }
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          } else {
            logger.error(
              `Throttler failed to warm cache for user ${username} after ${maxRetries} retries`,
              {
                error: message,
              }
            );
          }
        }
      }

      if (options.delayBetweenUsersMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayBetweenUsersMs));
      }
    };

    await Promise.all(users.map((user) => limit(() => warmUser(user))));
  }

  getTokenPoolSize(): number {
    return this.gitHubTokenPool.length;
  }

  getRateLimitState(): Map<string, number> {
    return new Map(this.rateLimitState);
  }
}

export const throttler = new Throttler();
