import { describe, expect, it, vi } from 'vitest';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from './time';

describe('time theme contrast', () => {
  it('should work correctly in light theme environment', () => {
    document.documentElement.dataset.theme = 'light';

    const result = getSecondsUntilUTCMidnight();

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(86400);
  });

  it('should work correctly in dark theme environment', () => {
    document.documentElement.dataset.theme = 'dark';

    const result = getSecondsUntilUTCMidnight();

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(86400);
  });

  it('should return valid time values in both themes', () => {
    const themes = ['light', 'dark'];

    themes.forEach((theme) => {
      document.documentElement.dataset.theme = theme;

      const result = getSecondsUntilMidnightInTimezone('Asia/Kolkata');

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(86400);
    });
  });

  it('should not depend on theme preference for UTC calculation', () => {
    document.documentElement.dataset.theme = 'light';

    const lightResult = getSecondsUntilUTCMidnight();

    document.documentElement.dataset.theme = 'dark';

    const darkResult = getSecondsUntilUTCMidnight();

    expect(Math.abs(lightResult - darkResult)).toBeLessThan(5);
  });

  it('should preserve timezone calculation with theme switching', () => {
    document.documentElement.dataset.theme = 'light';

    const lightResult = getSecondsUntilMidnightInTimezone('Asia/Kolkata');

    document.documentElement.dataset.theme = 'dark';

    const darkResult = getSecondsUntilMidnightInTimezone('Asia/Kolkata');

    expect(Math.abs(lightResult - darkResult)).toBeLessThan(5);
  });
});
