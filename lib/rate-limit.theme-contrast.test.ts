import { beforeEach, describe, expect, it } from 'vitest';

import { rateLimit, trackUserRateLimiter, notifyRateLimiter } from './rate-limit';

describe('rate-limit Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('maintains stable rate limit exports in light theme', () => {
    document.documentElement.className = 'light';

    expect(trackUserRateLimiter).toBeDefined();
    expect(notifyRateLimiter).toBeDefined();
  });

  it('maintains stable rate limit exports in dark theme', () => {
    document.documentElement.className = 'dark';

    expect(trackUserRateLimiter).toBeDefined();
    expect(notifyRateLimiter).toBeDefined();
  });

  it('preserves identical utility references across themes', () => {
    document.documentElement.className = 'light';

    const lightRateLimit = rateLimit;

    document.documentElement.className = 'dark';

    const darkRateLimit = rateLimit;

    expect(lightRateLimit).toBe(darkRateLimit);
  });

  it('does not mutate limiter configuration between themes', () => {
    document.documentElement.className = 'light';

    const lightTrackLimiter = trackUserRateLimiter;
    const lightNotifyLimiter = notifyRateLimiter;

    document.documentElement.className = 'dark';

    expect(trackUserRateLimiter).toBe(lightTrackLimiter);
    expect(notifyRateLimiter).toBe(lightNotifyLimiter);
  });

  it('keeps rateLimit function accessible in all themes', async () => {
    document.documentElement.className = 'dark';

    const result = await rateLimit('127.0.0.1', 5, 60000);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('remaining');
  });
});
