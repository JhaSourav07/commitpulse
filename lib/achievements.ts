import type { AchievementDef, AchievementState } from '@/types/achievements';

export function computeAchievementState(
  currentValue: number,
  def: AchievementDef
): AchievementState {
  const sortedLevels = [...def.levels].sort((a, b) => b.threshold - a.threshold);

  for (let i = 0; i < sortedLevels.length; i++) {
    const level = sortedLevels[i];
    if (currentValue >= level.threshold) {
      const currentTierIndex = def.levels.indexOf(level);
      const nextTier =
        currentTierIndex < def.levels.length - 1 ? def.levels[currentTierIndex + 1] : null;

      return {
        currentValue,
        targetValue: nextTier?.threshold ?? level.threshold,
        progress: nextTier
          ? Math.min(
              100,
              Math.round(
                ((currentValue - level.threshold) / (nextTier.threshold - level.threshold)) * 100
              )
            )
          : 100,
        unlocked: true,
        currentTier: level.tier,
        currentTierIndex,
        nextTier,
        xpEarned: sortedLevels
          .filter((l) => currentValue >= l.threshold)
          .reduce((sum, l) => sum + l.xp, 0),
        unlockedAt: null,
      };
    }
  }

  const nextTier = def.levels[0];
  return {
    currentValue,
    targetValue: nextTier.threshold,
    progress: Math.min(100, Math.round((currentValue / nextTier.threshold) * 100)),
    unlocked: false,
    currentTier: null,
    currentTierIndex: -1,
    nextTier,
    xpEarned: 0,
    unlockedAt: null,
  };
}
