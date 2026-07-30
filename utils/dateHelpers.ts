/**
 * Counts of commits bucketed by time-of-day window.
 */
export interface TimeOfDayMetrics {
  morning: number;   // 06:00–11:59 UTC
  afternoon: number; // 12:00–17:59 UTC
  evening: number;   // 18:00–23:59 UTC
  night: number;     // 00:00–05:59 UTC
}

/**
 * Buckets an array of commit timestamps into time-of-day buckets.
 * Useful for building "commits by hour" visualizations.
 *
 * @param commitDates - ISO date strings or Date objects.
 * @returns A TimeOfDayMetrics object with counts per time window.
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
