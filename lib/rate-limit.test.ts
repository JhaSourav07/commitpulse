import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within the limit', () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 60; i++) {
      const result = rateLimit(ip, 60, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(60 - (i + 1));
    }
  });

  it('blocks requests exceeding the limit', () => {
    const ip = '2.3.4.5';
    // Consume 60 requests
    for (let i = 0; i < 60; i++) {
      rateLimit(ip, 60, 60000);
    }

    // 61st request should fail
    const result = rateLimit(ip, 60, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', () => {
    const ip = '3.4.5.6';
    const windowMs = 60000;

    // Consume all requests
    for (let i = 0; i < 60; i++) {
      rateLimit(ip, 60, windowMs);
    }

    expect(rateLimit(ip, 60, windowMs).success).toBe(false);

    // Fast-forward time
    vi.advanceTimersByTime(windowMs + 1);

    const result = rateLimit(ip, 60, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it('tracks different IPs separately', () => {
    const ip1 = '11.11.11.11';
    const ip2 = '22.22.22.22';

    // Consume all requests for ip1
    for (let i = 0; i < 60; i++) {
      rateLimit(ip1, 60, 60000);
    }

    expect(rateLimit(ip1, 60, 60000).success).toBe(false);
    expect(rateLimit(ip2, 60, 60000).success).toBe(true);
  });
});
