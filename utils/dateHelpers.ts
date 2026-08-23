export interface TimeOfDayMetrics {
  morning: number; // 6 AM - 12 PM
  afternoon: number; // 12 PM - 6 PM
  evening: number; // 6 PM - 12 AM
  night: number; // 12 AM - 6 AM
}

export function processCommitTimestamps(commitDates?: (string | Date)[] | null): TimeOfDayMetrics {
  const metrics: TimeOfDayMetrics = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  if (!commitDates || !Array.isArray(commitDates)) {
    return metrics;
  }

  commitDates.forEach((dateItem) => {
    if (!dateItem) return;
    const date = new Date(dateItem);
    if (isNaN(date.getTime())) return;

    const hour =
      typeof dateItem === 'string' ? getAuthorLocalHour(dateItem) : dateItem.getUTCHours();

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

  // Validate ISO 8601 date format: YYYY-MM-DDTHH:MM:SS...
  if (!/^\d{4}-\d{2}-\d{2}T/.test(isoDate)) {
    const parsed = new Date(isoDate);
    return isNaN(parsed.getTime()) ? 0 : parsed.getHours();
  }

  if (isoDate.length >= 13) {
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
  if (!isoDate || typeof isoDate !== 'string') return 0;
  const parsed = new Date(isoDate);
  return isNaN(parsed.getTime()) ? 0 : parsed.getHours();
}
