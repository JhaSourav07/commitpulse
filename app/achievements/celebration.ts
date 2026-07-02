import type { AchievementData } from '@/types/achievements';

// Returns the most-recent unlock to celebrate, but only the first time a given
// username's most-recent unlock is seen in this browser (persisted per username
// so re-viewing the same profile does not re-fire; a newer unlock id will).
export function consumeUnlockCelebration(
  username: string,
  recentUnlocks: AchievementData[] | undefined
): AchievementData | null {
  const latest = recentUnlocks?.[0];
  if (!latest) return null;

  const storageKey = `cp-celebrated:${username.toLowerCase()}`;

  let lastCelebratedId: string | null = null;
  try {
    lastCelebratedId = window.localStorage.getItem(storageKey);
  } catch {
    // localStorage unavailable (private mode / SSR); celebrate without persisting.
    return latest;
  }

  if (lastCelebratedId === latest.def.id) return null;

  try {
    window.localStorage.setItem(storageKey, latest.def.id);
  } catch {
    // Ignore write failures; the celebration still shows for this session.
  }

  return latest;
}
