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
