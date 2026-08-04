import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import React, { type ReactNode } from 'react';
import DeveloperAchievementBadges, { computeAchievementBadges } from './DeveloperAchievementBadges';
import type { CompareUserData } from '@/app/compare/CompareClient';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
          React.createElement(tag as string, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const baseProfile = (username: string) => ({
  username,
  name: username,
  avatarUrl: '/avatar.png',
  isPro: false,
  bio: '',
  location: '',
  joinedDate: '2020',
  developerScore: 0,
  stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
});

const zeroUser = (username: string): CompareUserData => ({
  profile: baseProfile(username),
  stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0, totalPRs: 0, totalIssues: 0 },
  languages: [],
  activity: [],
});

const richUser: CompareUserData = {
  profile: {
    ...baseProfile('devAlice'),
    stats: { repositories: 45, followers: 1200, following: 300, stars: 850 },
  },
  stats: {
    currentStreak: 42,
    peakStreak: 120,
    totalContributions: 6500,
    totalPRs: 80,
    totalIssues: 20,
  },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percentage: 50 },
    { name: 'Rust', color: '#dea584', percentage: 30 },
  ],
  activity: [{ date: '2026-07-01', count: 10, intensity: 3 }],
};

describe('DeveloperAchievementBadges - Error Resilience', () => {
  // ── computeAchievementBadges pure function ─────────────────────────────

  it('always returns exactly 6 badges regardless of input', () => {
    expect(computeAchievementBadges(zeroUser('a'), zeroUser('b'))).toHaveLength(6);
    expect(computeAchievementBadges(richUser, zeroUser('b'))).toHaveLength(6);
  });

  it('returns all badges with winner="none" when all stats are 0 for both users', () => {
    const badges = computeAchievementBadges(zeroUser('a'), zeroUser('b'));
    const noneLocked = badges.filter((b) => b.winner === 'none');
    expect(noneLocked).toHaveLength(6);
  });

  it('does not throw when activity array is empty for both users', () => {
    const u1 = { ...richUser, activity: [] };
    const u2 = { ...zeroUser('b'), activity: [] };
    expect(() => computeAchievementBadges(u1, u2)).not.toThrow();
  });

  it('does not throw when languages array is empty for both users', () => {
    const u1 = { ...richUser, languages: [] };
    const u2 = { ...zeroUser('b'), languages: [] };
    expect(() => computeAchievementBadges(u1, u2)).not.toThrow();

    const badges = computeAchievementBadges(u1, u2);
    const polyglot = badges.find((b) => b.id === 'polyglot-developer');
    expect(polyglot?.winner).toBe('none');
  });

  it('does not throw when languages is undefined on both users', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u1 = { ...richUser, languages: undefined as any };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u2 = { ...zeroUser('b'), languages: undefined as any };
    expect(() => computeAchievementBadges(u1, u2)).not.toThrow();
  });

  it('does not throw when activity is undefined on both users', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u1 = { ...richUser, activity: undefined as any };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u2 = { ...zeroUser('b'), activity: undefined as any };
    expect(() => computeAchievementBadges(u1, u2)).not.toThrow();
  });

  // ── Component rendering resilience ────────────────────────────────────

  it('renders without crashing when activity array is empty', () => {
    const u1 = { ...richUser, activity: [] };
    expect(() =>
      render(<DeveloperAchievementBadges user1={u1} user2={zeroUser('devBob')} />)
    ).not.toThrow();
  });

  it('renders without crashing when languages array is empty', () => {
    const u1 = { ...richUser, languages: [] };
    expect(() =>
      render(<DeveloperAchievementBadges user1={u1} user2={zeroUser('devBob')} />)
    ).not.toThrow();
  });

  it('renders without crashing when all stats are 0 — shows all 6 badges as Locked', () => {
    expect(() =>
      render(<DeveloperAchievementBadges user1={zeroUser('userA')} user2={zeroUser('userB')} />)
    ).not.toThrow();

    const lockedPills = screen.getAllByText('Locked');
    expect(lockedPills).toHaveLength(6);
  });

  it('tooltip text for none-winner badges says "No achievement recorded yet"', () => {
    const badges = computeAchievementBadges(zeroUser('a'), zeroUser('b'));
    badges.forEach((b) => {
      expect(b.tooltipText).toContain('No achievement recorded yet');
    });
  });
});
