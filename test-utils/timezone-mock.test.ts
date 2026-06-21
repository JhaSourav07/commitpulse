import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  mockTimezone,
  restoreTimezone,
  withTimezone,
  getTimezoneOffsetMinutes,
  TEST_TIMEZONES,
} from './timezone-mock';

describe('timezone-mock helper', () => {
  afterEach(() => {
    restoreTimezone();
  });

  describe('mockTimezone', () => {
    it('sets process.env.TZ to the target timezone', () => {
      mockTimezone('Asia/Kolkata');
      expect(process.env.TZ).toBe('Asia/Kolkata');
    });

    it('overrides Intl.DateTimeFormat to default to the target timezone', () => {
      mockTimezone('America/New_York');

      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        hourCycle: 'h23',
      });
      const resolved = formatter.resolvedOptions();
      expect(resolved.timeZone).toBe('America/New_York');
    });

    it('allows explicit timezone to override the mock default', () => {
      mockTimezone('Asia/Tokyo');

      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: 'numeric',
        hour12: false,
        hourCycle: 'h23',
      });
      const resolved = formatter.resolvedOptions();
      expect(resolved.timeZone).toBe('UTC');
    });

    it('throws RangeError for invalid timezone identifiers', () => {
      expect(() => mockTimezone('Invalid/Timezone')).toThrow(RangeError);
    });

    it('can be called multiple times to switch timezones', () => {
      mockTimezone('UTC');
      expect(process.env.TZ).toBe('UTC');

      mockTimezone('Asia/Kolkata');
      expect(process.env.TZ).toBe('Asia/Kolkata');

      mockTimezone('America/Los_Angeles');
      expect(process.env.TZ).toBe('America/Los_Angeles');
    });
  });

  describe('restoreTimezone', () => {
    it('restores process.env.TZ to its original value', () => {
      const originalTZ = process.env.TZ;
      mockTimezone('Asia/Tokyo');
      restoreTimezone();
      expect(process.env.TZ).toBe(originalTZ);
    });

    it('restores Intl.DateTimeFormat to the original implementation', () => {
      const OriginalDTF = Intl.DateTimeFormat;
      mockTimezone('Europe/Berlin');
      restoreTimezone();
      expect(Intl.DateTimeFormat).toBe(OriginalDTF);
    });

    it('is safe to call multiple times (idempotent)', () => {
      mockTimezone('UTC');
      restoreTimezone();
      restoreTimezone(); // should not throw
      restoreTimezone();
    });

    it('is safe to call without prior mockTimezone call', () => {
      // should not throw
      restoreTimezone();
    });
  });

  describe('withTimezone', () => {
    it('executes the callback under the mocked timezone', () => {
      const result = withTimezone('Asia/Kolkata', () => {
        expect(process.env.TZ).toBe('Asia/Kolkata');
        return 42;
      });
      expect(result).toBe(42);
    });

    it('restores the timezone after the callback completes', () => {
      const originalTZ = process.env.TZ;
      withTimezone('America/New_York', () => {
        // inside mock
      });
      expect(process.env.TZ).toBe(originalTZ);
    });

    it('restores the timezone even if the callback throws', () => {
      const originalTZ = process.env.TZ;
      expect(() =>
        withTimezone('Asia/Tokyo', () => {
          throw new Error('test error');
        })
      ).toThrow('test error');
      expect(process.env.TZ).toBe(originalTZ);
    });
  });

  describe('getTimezoneOffsetMinutes', () => {
    it('returns 0 for UTC', () => {
      expect(getTimezoneOffsetMinutes('UTC')).toBe(0);
    });

    it('returns -300 for America/New_York (UTC-5)', () => {
      expect(getTimezoneOffsetMinutes('America/New_York')).toBe(-300);
    });

    it('returns 330 for Asia/Kolkata (UTC+5:30)', () => {
      expect(getTimezoneOffsetMinutes('Asia/Kolkata')).toBe(330);
    });

    it('returns 345 for Asia/Kathmandu (UTC+5:45)', () => {
      expect(getTimezoneOffsetMinutes('Asia/Kathmandu')).toBe(345);
    });

    it('returns 840 for Pacific/Kiritimati (UTC+14)', () => {
      expect(getTimezoneOffsetMinutes('Pacific/Kiritimati')).toBe(840);
    });

    it('returns -720 for Etc/GMT+12 (UTC-12)', () => {
      expect(getTimezoneOffsetMinutes('Etc/GMT+12')).toBe(-720);
    });

    it('throws RangeError for invalid timezone', () => {
      expect(() => getTimezoneOffsetMinutes('Not/A/Timezone')).toThrow(RangeError);
    });
  });

  describe('TEST_TIMEZONES', () => {
    it('contains at least 10 timezone entries', () => {
      expect(TEST_TIMEZONES.length).toBeGreaterThanOrEqual(10);
    });

    it('includes UTC', () => {
      expect(TEST_TIMEZONES).toContain('UTC');
    });

    it('includes extreme positive and negative offsets', () => {
      expect(TEST_TIMEZONES).toContain('Pacific/Kiritimati'); // UTC+14
      expect(TEST_TIMEZONES).toContain('Etc/GMT+12'); // UTC-12
    });

    it('includes fractional offset timezone (Asia/Kolkata)', () => {
      expect(TEST_TIMEZONES).toContain('Asia/Kolkata');
    });
  });

  describe('integration: Intl.DateTimeFormat.formatToParts under mock', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      restoreTimezone();
    });

    it('produces consistent hour values for Asia/Kolkata at a known UTC time', () => {
      // 2024-06-15T18:30:00Z = 2024-06-16T00:00:00 IST (midnight in Kolkata)
      vi.setSystemTime(new Date('2024-06-15T18:30:00.000Z'));
      mockTimezone('Asia/Kolkata');

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        hourCycle: 'h23',
      }).formatToParts(new Date());

      const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

      // At IST midnight, hour should be 0 (or 24 in some implementations, normalised by % 24)
      const hour = get('hour') % 24;
      expect(hour).toBe(0);
      expect(get('minute')).toBe(0);
      expect(get('second')).toBe(0);
    });

    it('produces consistent hour values for America/New_York at a known UTC time', () => {
      // 2024-06-15T04:00:00Z = 2024-06-15T00:00:00 EDT (midnight in New York during DST)
      vi.setSystemTime(new Date('2024-06-15T04:00:00.000Z'));
      mockTimezone('America/New_York');

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        hourCycle: 'h23',
      }).formatToParts(new Date());

      const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

      const hour = get('hour') % 24;
      expect(hour).toBe(0);
      expect(get('minute')).toBe(0);
      expect(get('second')).toBe(0);
    });

    it('produces consistent results across all TEST_TIMEZONES without throwing', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

      for (const tz of TEST_TIMEZONES) {
        mockTimezone(tz);

        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
          hourCycle: 'h23',
        }).formatToParts(new Date());

        const get = (type: string) =>
          parseInt(parts.find((p) => p.type === type)?.value ?? '-1', 10);

        const hour = get('hour');
        const minute = get('minute');
        const second = get('second');

        // All parts should be valid non-negative numbers
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThanOrEqual(24);
        expect(minute).toBeGreaterThanOrEqual(0);
        expect(minute).toBeLessThan(60);
        expect(second).toBeGreaterThanOrEqual(0);
        expect(second).toBeLessThan(60);

        restoreTimezone();
      }
    });
  });
});
