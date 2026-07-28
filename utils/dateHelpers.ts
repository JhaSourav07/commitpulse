/**
 * Date and time-of-day helper utilities for CommitPulse contribution analysis.
 *
 * Provides utilities for bucketing commit timestamps into time-of-day categories
 * (morning, afternoon, evening, night) for activity pattern analysis.
 *
 * @module
 */

/**
 * Breakdown of commit counts across four time-of-day windows.
 *
 * All times are interpreted in the local timezone of the contributing machine,
 * which means the bucket distribution may shift when viewed across timezones.
 * For UTC-based bucketing, normalise the input dates to UTC before calling
 * `processCommitTimestamps`.
 */
export interface TimeOfDayMetrics {
  /** Number of commits made between 06:00 and 11:59 (inclusive). */
  morning: number;

  /** Number of commits made between 12:00 and 17:59 (inclusive). */
  afternoon: number;

  /** Number of commits made between 18:00 and 23:59 (inclusive). */
  evening: number;

  /** Number of commits made between 00:00 and 05:59 (inclusive). */
  night: number;
}

/**
 * Buckets an array of commit timestamps into time-of-day categories.
 *
 * Parses each date using the local timezone of the runtime environment and
 * increments the corresponding bucket based on the hour-of-day. Null, undefined,
 * and unparseable values are silently skipped (they contribute zero to all buckets).
 *
 * @param commitDates - An array of ISO-8601 date strings or Date objects representing
 *   commit timestamps. Malformed values are ignored without throwing.
 * @returns A `TimeOfDayMetrics` object with counts for each time-of-day window.
 *
 * @example
 * ```ts
 * const timestamps = ['2024-01-15T09:30:00', '2024-01-15T14:00:00', '2024-01-15T22:00:00'];
 * const metrics = processCommitTimestamps(timestamps);
 * // { morning: 1, afternoon: 1, evening: 1, night: 0 }
 * ```
 *
 * @example
 * ```ts
 * const commits = [
 *   new Date('2024-06-01T02:00:00'),
 *   new Date('2024-06-01T10:00:00'),
 * ];
 * const { morning, night } = processCommitTimestamps(commits);
 * ```
 */
export function processCommitTimestamps(commitDates: string[] | Date[]): TimeOfDayMetrics {
  const metrics: TimeOfDayMetrics = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  commitDates.forEach((dateString) => {
    if (!dateString) return;
    const date = new Date(dateString);
    const hour = date.getHours();

    if (hour >= 6 && hour < 12) {
      metrics.morning++;
    } else if (hour >= 12 && hour < 18) {
      metrics.afternoon++;
    } else if (hour >= 18 && hour < 24) {
      metrics.evening++;
    } else {
      metrics.night++;
    }
  });

  return metrics;
}
