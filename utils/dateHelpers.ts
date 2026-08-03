export interface TimeOfDayMetrics {
  morning: number; // 6 AM - 12 PM
  afternoon: number; // 12 PM - 6 PM
  evening: number; // 6 PM - 12 AM
  night: number; // 12 AM - 6 AM
}

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

/**
 * Extracts the author's original local hour from a Git ISO timestamp string.
 * Example: '2024-03-10T15:30:00+02:00' -> 15
 */
export function getAuthorLocalHour(isoDate: string): number {
  if (!isoDate || typeof isoDate !== 'string') return 0;

  // Validate that the string contains a time component at the expected position
  // ISO 8601 format with time: 2024-03-10T15:30:00+02:00
  if (isoDate.length >= 13 && isoDate.includes('T')) {
    const hourStr = isoDate.substring(11, 13);
    const hour = parseInt(hourStr, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      return hour;
    }
  }

  // Fallback for malformed strings
  const parsed = new Date(isoDate);
  return isNaN(parsed.getTime()) ? 0 : parsed.getHours();
}

/**
 * Extracts the viewer's local hour from an ISO timestamp string.
 * This converts the timestamp to the browser's local timezone.
 */
export function getViewerLocalHour(isoDate: string): number {
  if (!isoDate) return 0;
  const parsed = new Date(isoDate);
  return isNaN(parsed.getTime()) ? 0 : parsed.getHours();
}
