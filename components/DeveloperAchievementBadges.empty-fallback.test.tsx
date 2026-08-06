import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import React, { type ReactNode } from 'react';
import DeveloperAchievementBadges from './DeveloperAchievementBadges';
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

// user1 wins everything, user2 wins nothing
const user1Wins: CompareUserData = {
  profile: {
    ...baseProfile('devAlice'),
    stats: { repositories: 10, followers: 100, following: 10, stars: 500 },
  },
  stats: {
    currentStreak: 30,
    peakStreak: 60,
    totalContributions: 2000,
    totalPRs: 40,
    totalIssues: 10,
  },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percentage: 60 },
    { name: 'Go', color: '#00add8', percentage: 40 },
  ],
  activity: [{ date: '2026-07-01', count: 5, intensity: 2 }],
};

const user2Wins: CompareUserData = {
  profile: {
    ...baseProfile('devBob'),
    stats: { repositories: 5, followers: 50, following: 5, stars: 100 },
  },
  stats: { currentStreak: 5, peakStreak: 10, totalContributions: 500, totalPRs: 5, totalIssues: 2 },
  languages: [{ name: 'Python', color: '#3572A5', percentage: 100 }],
  activity: [{ date: '2026-07-01', count: 1, intensity: 1 }],
};

describe('DeveloperAchievementBadges - Empty & Fallback State Verification', () => {
  // ── All stats zero → all badges locked ────────────────────────────────

  it('shows 6 "Locked" pills when all stats are 0 for both users', () => {
    render(<DeveloperAchievementBadges user1={zeroUser('userA')} user2={zeroUser('userB')} />);

    const lockedPills = screen.getAllByText('Locked');
    expect(lockedPills).toHaveLength(6);
  });

  it('shows no winner pills when all stats are 0', () => {
    render(<DeveloperAchievementBadges user1={zeroUser('userA')} user2={zeroUser('userB')} />);

    // "Tie" winner pill should not appear
    expect(screen.queryByText('Tie')).not.toBeInTheDocument();

    // Winner pills render text like "@userA" next to a CheckCircle icon inside inline-flex spans.
    // When all badges are locked only "Locked" pills appear — verify by checking the Locked count
    const lockedPills = screen.getAllByText('Locked');
    expect(lockedPills).toHaveLength(6);
  });

  // ── Filter: user1 with no wins shows no badges ─────────────────────────

  it('shows no badge cards when filtering by user2 and user2 has zero wins', () => {
    // user1 wins everything, user2 wins nothing and no ties
    render(<DeveloperAchievementBadges user1={user1Wins} user2={user2Wins} />);

    const u2Tab = screen.getByRole('button', { name: /@devBob/i });
    fireEvent.click(u2Tab);

    // No badge cards remain because user2 has no wins and no ties
    expect(screen.queryByText('Streak Master')).not.toBeInTheDocument();
    expect(screen.queryByText('Community Favorite')).not.toBeInTheDocument();
    expect(screen.queryByText('Top Contributor')).not.toBeInTheDocument();
  });

  it('shows all 6 badges when "All" filter is active', () => {
    render(<DeveloperAchievementBadges user1={user1Wins} user2={user2Wins} />);

    const allTab = screen.getByRole('button', { name: /All/i });
    fireEvent.click(allTab);

    expect(screen.getByText('Streak Master')).toBeInTheDocument();
    expect(screen.getByText('Community Favorite')).toBeInTheDocument();
    expect(screen.getByText('Top Contributor')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Expert')).toBeInTheDocument();
    expect(screen.getByText('Polyglot Developer')).toBeInTheDocument();
    expect(screen.getByText('Rising Developer')).toBeInTheDocument();
  });

  // ── Filtering by user1 shows only user1 wins ──────────────────────────

  it('filtering by user1 shows user1-winning badges', () => {
    render(<DeveloperAchievementBadges user1={user1Wins} user2={user2Wins} />);

    const u1Tab = screen.getByRole('button', { name: /@devAlice/i });
    fireEvent.click(u1Tab);

    // user1 wins all 6 categories — all should still be visible
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
  });

  // ── Badge count pills in filter tabs ──────────────────────────────────

  it('All filter tab shows total badge count (6)', () => {
    render(<DeveloperAchievementBadges user1={user1Wins} user2={user2Wins} />);

    expect(screen.getByRole('button', { name: /All \(6\)/i })).toBeInTheDocument();
  });

  it('user2 badge count pill shows 0 when user2 wins nothing', () => {
    render(<DeveloperAchievementBadges user1={user1Wins} user2={user2Wins} />);

    // The count badge next to @devBob should show 0
    const u2Tab = screen.getByRole('button', { name: /@devBob/i });
    expect(u2Tab).toBeInTheDocument();
    // The badge count span inside the button contains the number
    const countSpan = u2Tab.querySelector('span:last-child');
    expect(countSpan?.textContent).toBe('0');
  });

  // ── Dynamic awards description ─────────────────────────────────────────

  it('renders the subtitle about dynamic awards', () => {
    render(<DeveloperAchievementBadges user1={user1Wins} user2={user2Wins} />);

    expect(
      screen.getByText(/Dynamic awards earned based on head-to-head performance metrics/i)
    ).toBeInTheDocument();
  });
});
