import type { ActivityData } from '@/types/dashboard';

const tooltipDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatTooltipDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return tooltipDateFormatter.format(parsed);
}

export function getContributionLabel(count: number) {
  return `${count} contribution${count === 1 ? '' : 's'}`;
}

export function getActivityInsight(count: number, intensity?: ActivityData['intensity']) {
  if (count === 0) return 'No activity recorded';
  if (intensity === 4 || count >= 10) return 'Peak activity day';
  if (intensity === 3 || count >= 5) return 'High activity day';
  if (intensity === 2 || count >= 2) return 'Steady contribution day';

  return 'Light activity day';
}

export function getLocalActiveStreak(data: ActivityData[], index: number) {
  if (!data[index] || data[index].count === 0) {
    return 0;
  }

  let streak = 1;

  for (let i = index - 1; i >= 0 && data[i].count > 0; i--) {
    streak++;
  }

  for (let i = index + 1; i < data.length && data[i].count > 0; i++) {
    streak++;
  }

  return streak;
}

export function getStreakLabel(streak: number) {
  if (streak <= 0) return 'No active streak';

  return `${streak}-day active streak`;
}
