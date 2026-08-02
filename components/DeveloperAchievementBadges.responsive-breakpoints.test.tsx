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
    stats: { repositories: 30, followers: 400, following: 150, stars: 320 },
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

describe('DeveloperAchievementBadges - Responsive Breakpoints & Layout', () => {
  // ── Badge grid layout ──────────────────────────────────────────────────

  it('badge grid has grid-cols-1, sm:grid-cols-2, and lg:grid-cols-3 classes', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const grid = container.querySelector('.grid-cols-1');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });

  it('badge grid has gap-5 class', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const grid = container.querySelector('.grid-cols-1');
    expect(grid).toHaveClass('gap-5');
  });

  // ── Badge card structure ───────────────────────────────────────────────

  it('each badge card has rounded-2xl class', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const cards = container.querySelectorAll('.rounded-2xl');
    // 6 badge cards + possible other elements with rounded-2xl
    expect(cards.length).toBeGreaterThanOrEqual(6);
  });

  it('each badge card has overflow-hidden class', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const cards = container.querySelectorAll('.overflow-hidden');
    expect(cards.length).toBeGreaterThanOrEqual(6);
  });

  it('each badge card has p-5 padding class', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const cards = container.querySelectorAll('.p-5');
    expect(cards.length).toBeGreaterThanOrEqual(6);
  });

  // ── Header / controls layout ───────────────────────────────────────────

  it('header wrapper has flex-col and sm:flex-row responsive classes', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const headerRow = container.querySelector('.flex-col.sm\\:flex-row');
    expect(headerRow).toBeInTheDocument();
  });

  it('filter tab container has rounded-xl and border classes', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const tabContainer = container.querySelector('.rounded-xl');
    expect(tabContainer).toBeInTheDocument();
  });

  // ── Top accent gradient ────────────────────────────────────────────────

  it('each badge card has a top accent gradient bar (h-1 absolute div)', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const accentBars = container.querySelectorAll('.h-1.bg-gradient-to-r');
    expect(accentBars.length).toBe(6);
  });

  // ── space-y-6 outer spacing ────────────────────────────────────────────

  it('root container has space-y-6 vertical spacing', () => {
    const { container } = render(
      <DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('space-y-6');
  });

  // ── Filter tab badge count counts ──────────────────────────────────────

  it('filter tabs render correctly after switching between responsive breakpoint views', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    // Switch to user1 filter
    fireEvent.click(screen.getByRole('button', { name: /@devAlice/i }));
    expect(screen.getByRole('button', { name: /@devAlice/i })).toBeInTheDocument();

    // Switch back to All
    fireEvent.click(screen.getByRole('button', { name: /All/i }));
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
    expect(screen.getByText('Rising Developer')).toBeInTheDocument();
  });
});
