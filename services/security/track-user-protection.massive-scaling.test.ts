import { describe, it, expect } from 'vitest';
import { TrackUserProtection } from './track-user-protection';

describe('TrackUserProtection massive scaling behavior', () => {
  it('records writes for 1000 unique usernames and enforces cooldown on all', () => {
    const tracker = TrackUserProtection.getInstance();
    tracker.reset();

    for (let i = 0; i < 1000; i++) {
      tracker.recordWrite(`user${i}`);
    }

    for (let i = 0; i < 1000; i++) {
      expect(tracker.isWriteAllowed(`user${i}`)).toBe(false);
    }
  });

  it('validates format for 1000 usernames without throwing', () => {
    const tracker = TrackUserProtection.getInstance();

    expect(() => {
      for (let i = 0; i < 1000; i++) {
        tracker.validateFormat(`user${i}`);
      }
    }).not.toThrow();
  });

  it('normalizes usernames consistently under high volume', () => {
    const tracker = TrackUserProtection.getInstance();
    tracker.reset();

    for (let i = 0; i < 500; i++) {
      tracker.recordWrite(`  USER${i}  `);
    }

    for (let i = 0; i < 500; i++) {
      expect(tracker.isWriteAllowed(`user${i}`)).toBe(false);
    }
  });

  it('clears the full cache on reset after bulk writes', () => {
    const tracker = TrackUserProtection.getInstance();
    tracker.reset();

    for (let i = 0; i < 1000; i++) {
      tracker.recordWrite(`user${i}`);
    }

    tracker.reset();

    for (let i = 0; i < 1000; i++) {
      expect(tracker.isWriteAllowed(`user${i}`)).toBe(true);
    }
  });

  it('completes format validation for 10000 usernames within acceptable time', () => {
    const tracker = TrackUserProtection.getInstance();

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      tracker.validateFormat(`user${i}-test`);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});
