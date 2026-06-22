// test-utils/timezone-mock.ts
//
// Provides a deterministic timezone mock helper for Vitest tests.
// Ensures that timezone-sensitive tests produce consistent results
// regardless of the system timezone (e.g., UTC on CI vs local dev timezone).

import { vi } from 'vitest';

/**
 * A map of IANA timezone identifiers to their UTC offsets in minutes.
 * Positive values are east of UTC (ahead), negative values are west (behind).
 */
const TIMEZONE_OFFSETS: Record<string, number> = {
  UTC: 0,
  'Etc/UTC': 0,
  'Etc/GMT': 0,
  'Europe/London': 0,
  'America/New_York': -300, // UTC-5
  'US/Eastern': -300, // UTC-5
  'America/Chicago': -360, // UTC-6
  'America/Denver': -420, // UTC-7
  'America/Los_Angeles': -480, // UTC-8
  'US/Pacific': -480, // UTC-8
  'America/Anchorage': -540, // UTC-9
  'Pacific/Honolulu': -600, // UTC-10
  'Pacific/Midway': -660, // UTC-11
  'Etc/GMT+12': -720, // UTC-12
  'Etc/GMT+11': -660,
  'Etc/GMT+10': -600,
  'Etc/GMT+9': -540,
  'Etc/GMT+8': -480,
  'Etc/GMT+7': -420,
  'Etc/GMT+6': -360,
  'Etc/GMT+5': -300,
  'Etc/GMT+4': -240,
  'Etc/GMT+3': -180,
  'Etc/GMT+2': -120,
  'Etc/GMT+1': -60,
  'Etc/GMT-1': 60,
  'Etc/GMT-2': 120,
  'Etc/GMT-3': 180,
  'Etc/GMT-4': 240,
  'Etc/GMT-5': 300,
  'Etc/GMT-6': 360,
  'Etc/GMT-7': 420,
  'Etc/GMT-8': 480,
  'Etc/GMT-9': 540,
  'Etc/GMT-10': 600,
  'Etc/GMT-11': 660,
  'Etc/GMT-12': 720,
  'Etc/GMT-13': 780,
  'Etc/GMT-14': 840,
  'Europe/Paris': 60, // UTC+1
  'Europe/Berlin': 60, // UTC+1
  'Europe/Moscow': 180, // UTC+3
  'Asia/Dubai': 240, // UTC+4
  'Asia/Kolkata': 330, // UTC+5:30
  'Asia/Kathmandu': 345, // UTC+5:45
  'Asia/Dhaka': 360, // UTC+6
  'Asia/Bangkok': 420, // UTC+7
  'Asia/Shanghai': 480, // UTC+8
  'Asia/Tokyo': 540, // UTC+9
  'Australia/Sydney': 600, // UTC+10
  'Pacific/Auckland': 720, // UTC+12
  'Pacific/Chatham': 765, // UTC+12:45
  'Pacific/Kiritimati': 840, // UTC+14
};

/**
 * Resolve the UTC offset in minutes for a given IANA timezone string.
 * Falls back to the real `Intl.DateTimeFormat` for unrecognised zone names.
 */
function resolveOffsetMinutes(timezone: string): number {
  if (timezone in TIMEZONE_OFFSETS) {
    return TIMEZONE_OFFSETS[timezone];
  }

  // Fallback: use the real Intl.DateTimeFormat to resolve the offset
  try {
    const formatter = new OriginalDateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(new Date('2024-06-15T12:00:00Z'));
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart) {
      const match = tzPart.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2] || '0', 10);
        return hours * 60 + (hours < 0 ? -minutes : minutes);
      }
    }
  } catch {
    // timezone is invalid — let the caller deal with it
  }

  throw new RangeError(`Invalid time zone specified: ${timezone}`);
}

// Store the real Intl.DateTimeFormat before any mocking
const OriginalDateTimeFormat = Intl.DateTimeFormat;

interface TimezoneMockState {
  originalDateTimeFormat: typeof Intl.DateTimeFormat;
  originalTZ: string | undefined;
  isActive: boolean;
}

const state: TimezoneMockState = {
  originalDateTimeFormat: Intl.DateTimeFormat,
  originalTZ: process.env.TZ,
  isActive: false,
};

/**
 * Creates a mocked `Intl.DateTimeFormat` that forces `resolvedOptions().timeZone`
 * to return the target timezone, while the underlying `format()` and
 * `formatToParts()` calls are delegated to the real implementation with the
 * target timezone explicitly set.
 *
 * This ensures that code relying on `Intl.DateTimeFormat` for timezone-aware
 * date formatting will produce consistent results in tests, regardless of
 * the system timezone.
 */
function createMockedDateTimeFormat(targetTimezone: string): typeof Intl.DateTimeFormat {
  const OrigDTF = state.originalDateTimeFormat;

  function MockDateTimeFormat(
    this: Intl.DateTimeFormat,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): Intl.DateTimeFormat {
    // If no timezone was provided in the options, use the target timezone
    const resolvedOptions: Intl.DateTimeFormatOptions = {
      ...options,
      timeZone: options?.timeZone || targetTimezone,
    };

    if (new.target) {
      return new OrigDTF(locales, resolvedOptions);
    }
    return OrigDTF(locales, resolvedOptions);
  }

  // Copy static methods and prototype
  MockDateTimeFormat.prototype = OrigDTF.prototype;
  MockDateTimeFormat.supportedLocalesOf = OrigDTF.supportedLocalesOf;

  return MockDateTimeFormat as unknown as typeof Intl.DateTimeFormat;
}

/**
 * Mock the system timezone for the duration of a test.
 *
 * Sets `process.env.TZ` and overrides `Intl.DateTimeFormat` so that
 * any code relying on the system timezone will use the target timezone.
 *
 * @param timezone - An IANA timezone string (e.g. "America/New_York", "Asia/Kolkata")
 *
 * @example
 * ```ts
 * import { mockTimezone, restoreTimezone } from '@/test-utils/timezone-mock';
 *
 * describe('timezone-sensitive feature', () => {
 *   afterEach(() => restoreTimezone());
 *
 *   it('works in Asia/Kolkata', () => {
 *     mockTimezone('Asia/Kolkata');
 *     // ... your test
 *   });
 * });
 * ```
 */
export function mockTimezone(timezone: string): void {
  // Validate the timezone is resolvable (throws RangeError if invalid)
  resolveOffsetMinutes(timezone);

  if (!state.isActive) {
    state.originalTZ = process.env.TZ;
    state.originalDateTimeFormat = Intl.DateTimeFormat;
  }

  process.env.TZ = timezone;

  Object.defineProperty(Intl, 'DateTimeFormat', {
    value: createMockedDateTimeFormat(timezone),
    writable: true,
    configurable: true,
  });

  state.isActive = true;
}

/**
 * Restore the original timezone and `Intl.DateTimeFormat`.
 * Should be called in `afterEach` to clean up after `mockTimezone`.
 */
export function restoreTimezone(): void {
  if (!state.isActive) return;

  if (state.originalTZ !== undefined) {
    process.env.TZ = state.originalTZ;
  } else {
    delete process.env.TZ;
  }

  Object.defineProperty(Intl, 'DateTimeFormat', {
    value: state.originalDateTimeFormat,
    writable: true,
    configurable: true,
  });

  state.isActive = false;
}

/**
 * Convenience wrapper that mocks the timezone for the duration of a callback.
 * Automatically restores the original timezone after the callback completes,
 * even if it throws.
 *
 * @param timezone - IANA timezone string
 * @param fn - Test body to run under the mocked timezone
 *
 * @example
 * ```ts
 * import { withTimezone } from '@/test-utils/timezone-mock';
 *
 * it('handles IST correctly', () => {
 *   withTimezone('Asia/Kolkata', () => {
 *     const result = getSecondsUntilMidnightInTimezone('Asia/Kolkata');
 *     expect(result).toBeGreaterThan(0);
 *   });
 * });
 * ```
 */
export function withTimezone<T>(timezone: string, fn: () => T): T {
  mockTimezone(timezone);
  try {
    return fn();
  } finally {
    restoreTimezone();
  }
}

/**
 * Get the UTC offset in minutes for a given IANA timezone string.
 * Useful for writing assertions about timezone offsets.
 *
 * @param timezone - IANA timezone string
 * @returns Offset in minutes (positive = east of UTC)
 */
export function getTimezoneOffsetMinutes(timezone: string): number {
  return resolveOffsetMinutes(timezone);
}

/**
 * List of common timezone identifiers available for testing.
 * Use this for parameterised tests that need to iterate over timezones.
 */
export const TEST_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Kiritimati',
  'Pacific/Honolulu',
  'Etc/GMT+12',
  'Etc/GMT-14',
] as const;
