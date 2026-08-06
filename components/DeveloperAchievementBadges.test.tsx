import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
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

const mockUser1: CompareUserData = {
  profile: {
    username: 'devAlice',
    name: 'Alice Dev',
    avatarUrl: '/avatar1.png',
    isPro: true,
    bio: 'Fullstack Architect',
    location: 'San Francisco, CA',
    joinedDate: '2020',
    developerScore: 95,
    stats: {
      repositories: 45,
      followers: 1200,
      following: 300,
      stars: 850,
    },
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
    { name: 'Go', color: '#00add8', percentage: 20 },
  ],
  activity: [
    { date: '2026-07-01', count: 10, intensity: 3 },
    { date: '2026-07-02', count: 15, intensity: 4 },
  ],
};

const mockUser2: CompareUserData = {
  profile: {
    username: 'devBob',
    name: 'Bob Coder',
    avatarUrl: '/avatar2.png',
    isPro: false,
    bio: 'Backend Specialist',
    location: 'Berlin, Germany',
    joinedDate: '2021',
    developerScore: 82,
    stats: {
      repositories: 30,
      followers: 400,
      following: 150,
      stars: 320,
    },
  },
  stats: {
    currentStreak: 15,
    peakStreak: 50,
    totalContributions: 3200,
    totalPRs: 15,
    totalIssues: 5,
  },
  languages: [
    { name: 'Python', color: '#3572A5', percentage: 70 },
    { name: 'SQL', color: '#e38c00', percentage: 30 },
  ],
  activity: [
    { date: '2026-07-01', count: 2, intensity: 1 },
    { date: '2026-07-02', count: 3, intensity: 1 },
  ],
};

describe('computeAchievementBadges logic', () => {
  it('correctly calculates badge winners for distinct stats', () => {
    const badges = computeAchievementBadges(mockUser1, mockUser2);

    expect(badges).toHaveLength(6);

    const streakBadge = badges.find((b) => b.id === 'streak-master');
    expect(streakBadge?.winner).toBe('user1');
    expect(streakBadge?.winnerUsername).toBe('devAlice');

    const starsBadge = badges.find((b) => b.id === 'community-favorite');
    expect(starsBadge?.winner).toBe('user1');

    const polyglotBadge = badges.find((b) => b.id === 'polyglot-developer');
    expect(polyglotBadge?.winner).toBe('user1');
    expect(polyglotBadge?.user1Val).toBe(3);
    expect(polyglotBadge?.user2Val).toBe(2);
  });

  it('handles ties when developers have identical non-zero stats', () => {
    const tiedUser1: CompareUserData = {
      ...mockUser1,
      profile: {
        ...mockUser1.profile,
        stats: { ...mockUser1.profile.stats, stars: 500 },
      },
    };
    const tiedUser2: CompareUserData = {
      ...mockUser2,
      profile: {
        ...mockUser2.profile,
        stats: { ...mockUser2.profile.stats, stars: 500 },
      },
    };

    const badges = computeAchievementBadges(tiedUser1, tiedUser2);
    const starsBadge = badges.find((b) => b.id === 'community-favorite');

    expect(starsBadge?.winner).toBe('tie');
    expect(starsBadge?.tooltipText).toContain('Both developers tied');
  });

  it('handles zero stats gracefully as unearned / none', () => {
    const zeroUser1: CompareUserData = {
      ...mockUser1,
      stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
    };
    const zeroUser2: CompareUserData = {
      ...mockUser2,
      stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
    };

    const badges = computeAchievementBadges(zeroUser1, zeroUser2);
    const streakBadge = badges.find((b) => b.id === 'streak-master');

    expect(streakBadge?.winner).toBe('none');
  });
});

describe('DeveloperAchievementBadges Component', () => {
  it('renders section title and badge cards', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    expect(screen.getByText(/Developer Achievement Badges/i)).toBeInTheDocument();
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
    expect(screen.getByText('Community Favorite')).toBeInTheDocument();
    expect(screen.getByText('Top Contributor')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Expert')).toBeInTheDocument();
    expect(screen.getByText('Polyglot Developer')).toBeInTheDocument();
    expect(screen.getByText('Rising Developer')).toBeInTheDocument();
  });

  it('filters badges by recipient tabs', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    const user1Tab = screen.getByRole('button', { name: /@devAlice/i });
    const user2Tab = screen.getByRole('button', { name: /@devBob/i });
    const allTab = screen.getByRole('button', { name: /All/i });

    // Click @devAlice filter tab
    fireEvent.click(user1Tab);
    expect(screen.getAllByText(/@devAlice/i).length).toBeGreaterThan(0);

    // Click @devBob filter tab
    fireEvent.click(user2Tab);
    expect(screen.getByRole('button', { name: /@devBob/i })).toBeInTheDocument();

    // Click All tab
    fireEvent.click(allTab);
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
  });

  it('displays tooltip explaining badge on mouse enter', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    const streakCard = screen.getByText('Streak Master').closest('.group');
    expect(streakCard).not.toBeNull();

    if (streakCard) {
      fireEvent.mouseEnter(streakCard);
      expect(screen.getByText(/won Streak Master with 120 days streak/i)).toBeInTheDocument();

      fireEvent.mouseLeave(streakCard);
    }
  });
});
