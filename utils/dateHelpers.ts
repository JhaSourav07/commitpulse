/**
 * Utilities for classifying and aggregating commit timestamps by time-of-day.
 *
 * The primary use-case is producing a `TimeOfDayMetrics` summary for the
 * commit clock visualization, showing contributors when (in their local day)
 * they are most active.
 */

/**
 * Aggregated commit counts bucketed by the contributor's local time-of-day.
 *
 * Buckets follow a standard day division:
 * - **morning** — 06:00 to 11:59 (inclusive)
 * - **afternoon** — 12:00 to 17:59
 * - **evening** — 18:00 to 23:59
 * - **night** — 00:00 to 05:59
 */
export interface TimeOfDayMetrics {
  /** Number of commits made in the morning window (06:00 - 11:59). */
  morning: number;
  /** Number of commits made in the afternoon window (12:00 - 17:59). */
  afternoon: number;
  /** Number of commits made in the evening window (18:00 - 23:59). */
  evening: number;
  /** Number of commits made in the night window (00:00 - 05:59). */
  night: number;
}

/**
 * Aggregates an array of commit timestamps into a `TimeOfDayMetrics` summary.
 *
 * The bucket assignment uses the browser/Node.js `Date.getHours()` which
 * interprets each timestamp in the caller's local timezone. Results are
 * therefore influenced by the server or client timezone where this function
 * runs.
 *
 * @param commitDates - Array of ISO date strings or `Date` objects representing commit timestamps.
 * @returns A `TimeOfDayMetrics` object with counts for each time-of-day bucket.
 *
 * @example
 * const timestamps = ['2024-01-15T08:30:00Z', '2024-01-15T14:00:00Z', '2024-01-15T22:00:00Z'];
 * const metrics = processCommitTimestamps(timestamps);
 * // metrics.morning    → 1
 * // metrics.afternoon  → 1
 * // metrics.evening    → 1
 * // metrics.night      → 0
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
