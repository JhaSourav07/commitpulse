import { describe, it, expect, beforeEach } from 'vitest';
import { consumeUnlockCelebration } from './celebration';
import type { AchievementData } from '@/types/achievements';

function ach(id: string): AchievementData {
  return { def: { id } } as unknown as AchievementData;
}

describe('consumeUnlockCelebration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when there are no recent unlocks', () => {
    expect(consumeUnlockCelebration('octocat', [])).toBeNull();
    expect(consumeUnlockCelebration('octocat', undefined)).toBeNull();
  });

  it('celebrates the most recent unlock the first time, then not again for the same username', () => {
    const unlocks = [ach('streak-master'), ach('pr-rookie')];

    expect(consumeUnlockCelebration('octocat', unlocks)?.def.id).toBe('streak-master');
    // Re-viewing the same profile with the same most-recent unlock must not re-fire.
    expect(consumeUnlockCelebration('octocat', unlocks)).toBeNull();
  });

  it('celebrates again when the most recent unlock changes', () => {
    expect(consumeUnlockCelebration('octocat', [ach('a')])?.def.id).toBe('a');
    expect(consumeUnlockCelebration('octocat', [ach('a')])).toBeNull();
    // A newer unlock at the front -> celebrate the new one.
    expect(consumeUnlockCelebration('octocat', [ach('b'), ach('a')])?.def.id).toBe('b');
  });

  it('gates per username, case-insensitively', () => {
    expect(consumeUnlockCelebration('Octocat', [ach('a')])?.def.id).toBe('a');
    expect(consumeUnlockCelebration('octocat', [ach('a')])).toBeNull();
    // A different username has its own gate.
    expect(consumeUnlockCelebration('torvalds', [ach('a')])?.def.id).toBe('a');
  });
});
