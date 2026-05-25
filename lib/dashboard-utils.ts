import { ActivityData } from '@/types/dashboard';

/**
 * Filters activity data based on the selected time range and applies downsampling
 * if the resulting dataset exceeds 60 entries.
 *
 * @param data - The array of activity data points.
 * @param tab - The time range tab selected ('1W', '1M', '3M', '1Y').
 * @returns A filtered and potentially downsampled array of activity data.
 */
export function getFilteredActivityData(data: ActivityData[], tab: string): ActivityData[] {
  let days = 90;
  if (tab === '1W') days = 7;
  if (tab === '1M') days = 30;
  if (tab === '1Y') days = 365;

  const recent = data.slice(-days);

  if (recent.length > 60) {
    const step = Math.ceil(recent.length / 60);
    return recent.filter((_, i) => i % step === 0).slice(-60);
  }

  return recent;
}
