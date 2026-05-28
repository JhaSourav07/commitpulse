// middleware/rate-limit.ts

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  waitTimeMs: number;
}

interface Bucket {
  tokens: number;
  lastRefillTime: number;
}

export class TokenBucketRateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private readonly maxQueueWaitMs: number; // max wait time for deferred execution

  constructor(
    maxTokens = 200,
    refillRatePerSec = 10, // 10 tokens per second
    maxQueueWaitMs = 5000 // 5 seconds maximum wait time
  ) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRatePerSec / 1000;
    this.maxQueueWaitMs = maxQueueWaitMs;
  }

  /**
   * Refills the tokens in a user's bucket based on elapsed time.
   */
  private refill(bucket: Bucket, now: number): void {
    const elapsed = now - bucket.lastRefillTime;
    if (elapsed > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsed * this.refillRate);
      bucket.lastRefillTime = now;
    }
  }

  /**
   * Attempt to consume tokens for a request.
   * If not enough tokens are available but wait time is under maxQueueWaitMs,
   * it returns waitTimeMs to delay execution.
   */
  async consume(key: string, cost: number): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefillTime: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens
    this.refill(bucket, now);

    // Deduct cost (tokens can temporarily go negative for queueing)
    const proposedTokens = bucket.tokens - cost;

    if (proposedTokens >= 0) {
      // Immediate execution allowed
      bucket.tokens = proposedTokens;
      const resetTime = this.calculateResetTime(proposedTokens);
      return {
        allowed: true,
        limit: this.maxTokens,
        remaining: Math.floor(proposedTokens),
        reset: resetTime,
        waitTimeMs: 0,
      };
    }

    // proposedTokens is negative, calculate wait time to get back to 0
    const neededTokens = -proposedTokens;
    const waitTimeMs = Math.round(neededTokens / this.refillRate);

    if (waitTimeMs <= this.maxQueueWaitMs) {
      // Queue/defer execution: accept deduction, wait, and then allow
      bucket.tokens = proposedTokens;

      // Wait in-place (deferred queue execution)
      await new Promise((resolve) => setTimeout(resolve, waitTimeMs));

      // After wait, refill bucket to reflect elapsed time
      const postWaitNow = Date.now();
      this.refill(bucket, postWaitNow);

      const resetTime = this.calculateResetTime(bucket.tokens);
      return {
        allowed: true,
        limit: this.maxTokens,
        remaining: Math.floor(Math.max(0, bucket.tokens)),
        reset: resetTime,
        waitTimeMs,
      };
    }

    // Exceeds max wait time: Reject request, DO NOT deduct tokens
    const resetTime = this.calculateResetTime(bucket.tokens);
    return {
      allowed: false,
      limit: this.maxTokens,
      remaining: Math.floor(bucket.tokens),
      reset: resetTime,
      waitTimeMs: 0,
    };
  }

  private calculateResetTime(currentTokens: number): number {
    const missing = this.maxTokens - currentTokens;
    const timeToFillMs = missing / this.refillRate;
    return Math.ceil((Date.now() + timeToFillMs) / 1000);
  }

  /**
   * Helper to inspect the current state of a bucket without consuming anything.
   */
  getBucketState(key: string): { limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.maxTokens, lastRefillTime: now };

    // Create copy to avoid mutating actual state
    const tempBucket = { ...bucket };
    this.refill(tempBucket, now);

    const resetTime = this.calculateResetTime(tempBucket.tokens);
    return {
      limit: this.maxTokens,
      remaining: Math.floor(tempBucket.tokens),
      reset: resetTime,
    };
  }

  /**
   * Reset / clear buckets (mainly for tests)
   */
  clear(): void {
    this.buckets.clear();
  }
}

// Export a singleton instance for global rate limiting
export const globalRateLimiter = new TokenBucketRateLimiter(200, 10, 5000);
