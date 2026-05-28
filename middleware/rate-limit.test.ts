// middleware/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBucketRateLimiter } from './rate-limit';

describe('TokenBucketRateLimiter', () => {
  let limiter: TokenBucketRateLimiter;

  beforeEach(() => {
    // maxTokens = 50, refillRate = 10 tokens/sec (0.01 tokens/ms), maxQueueWaitMs = 1000 ms
    limiter = new TokenBucketRateLimiter(50, 10, 1000);
  });

  it('allows immediate execution when enough tokens are present', async () => {
    const result = await limiter.consume('user-1', 20);
    expect(result.allowed).toBe(true);
    expect(result.waitTimeMs).toBe(0);
    expect(result.remaining).toBe(30);
  });

  it('queues/defers execution if tokens are insufficient but wait is short', async () => {
    // Consume 40, leaving 10
    await limiter.consume('user-2', 40);

    // Consume another 20. Only 10 remaining. Need 10 more.
    // Refill rate is 10/sec = 0.01/ms.
    // Time needed = 10 / 0.01 = 1000 ms.
    // Since 1000 ms <= maxQueueWaitMs (1000 ms), this should be deferred/delayed.
    const startTime = Date.now();
    const result = await limiter.consume('user-2', 20);
    const duration = Date.now() - startTime;

    expect(result.allowed).toBe(true);
    expect(result.waitTimeMs).toBeGreaterThanOrEqual(900); // close to 1000ms
    expect(duration).toBeGreaterThanOrEqual(900);
  });

  it('rejects immediately with allowed=false if wait time exceeds maxQueueWaitMs', async () => {
    // Consume 40, leaving 10
    await limiter.consume('user-3', 40);

    // Consume 30 more. Need 20 more.
    // Time needed = 20 / 0.01 = 2000 ms.
    // 2000 ms > maxQueueWaitMs (1000 ms), so it should reject immediately.
    const startTime = Date.now();
    const result = await limiter.consume('user-3', 30);
    const duration = Date.now() - startTime;

    expect(result.allowed).toBe(false);
    expect(result.waitTimeMs).toBe(0);
    expect(duration).toBeLessThan(100); // executed immediately
  });

  it('isolates rate limits between different users/IPs', async () => {
    // Consume all tokens for user-A
    await limiter.consume('user-A', 50);

    // user-B should still be allowed immediately
    const resultB = await limiter.consume('user-B', 10);
    expect(resultB.allowed).toBe(true);
    expect(resultB.waitTimeMs).toBe(0);
  });
});
