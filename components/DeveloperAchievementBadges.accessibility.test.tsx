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

describe('DeveloperAchievementBadges - Accessibility Standards & ARIA Compliance', () => {
  it('renders the section heading "Developer Achievement Badges"', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);
    expect(screen.getByText(/Developer Achievement Badges/i)).toBeInTheDocument();
  });

  it('All, @user1, @user2 filter controls are native <button> elements', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    const allBtn = screen.getByRole('button', { name: /All/i });
    const u1Btn = screen.getByRole('button', { name: /@devAlice/i });
    const u2Btn = screen.getByRole('button', { name: /@devBob/i });

    expect(allBtn.tagName).toBe('BUTTON');
    expect(u1Btn.tagName).toBe('BUTTON');
    expect(u2Btn.tagName).toBe('BUTTON');
  });

  it('each badge card title is in an <h3> heading', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    const headings = screen.getAllByRole('heading', { level: 3 });
    const titles = headings.map((h) => h.textContent);

    expect(titles).toContain('Streak Master');
    expect(titles).toContain('Community Favorite');
    expect(titles).toContain('Top Contributor');
    expect(titles).toContain('Collaboration Expert');
    expect(titles).toContain('Polyglot Developer');
    expect(titles).toContain('Rising Developer');
  });

  it('renders all 6 category labels as readable text', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('Popularity')).toBeInTheDocument();
    expect(screen.getByText('Impact')).toBeInTheDocument();
    expect(screen.getByText('Teamwork')).toBeInTheDocument();
    expect(screen.getByText('Versatility')).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
  });

  it('renders all 6 badge description texts', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    expect(screen.getByText('Highest contribution streak achieved')).toBeInTheDocument();
    expect(screen.getByText('Most total stars received across repositories')).toBeInTheDocument();
    expect(screen.getByText('Highest overall contribution count')).toBeInTheDocument();
    expect(screen.getByText('Most pull requests and issues opened')).toBeInTheDocument();
    expect(
      screen.getByText('Uses the highest number of programming languages')
    ).toBeInTheDocument();
    expect(screen.getByText(/Fastest growth/i)).toBeInTheDocument();
  });

  it('filter buttons are keyboard focusable', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    const allBtn = screen.getByRole('button', { name: /All/i });
    allBtn.focus();
    expect(document.activeElement).toBe(allBtn);

    const u1Btn = screen.getByRole('button', { name: /@devAlice/i });
    u1Btn.focus();
    expect(document.activeElement).toBe(u1Btn);
  });

  it('renders metric labels for screen reader context', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    expect(screen.getByText('Peak Streak')).toBeInTheDocument();
    expect(screen.getByText('Total Stars')).toBeInTheDocument();
    expect(screen.getByText('Contributions')).toBeInTheDocument();
    expect(screen.getByText('PRs & Issues')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Recent Act.')).toBeInTheDocument();
  });

  it('winner pills render accessible text identifying the winner', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    // devAlice wins most badges — at least one @devAlice winner pill present
    const winnerPills = screen.getAllByText(/@devAlice/i);
    expect(winnerPills.length).toBeGreaterThan(0);
  });

  it('tooltip text is readable when card is hovered', () => {
    render(<DeveloperAchievementBadges user1={mockUser1} user2={mockUser2} />);

    const card = screen.getByText('Streak Master').closest('.group');
    expect(card).not.toBeNull();
    if (card) {
      fireEvent.mouseEnter(card);
      expect(screen.getByText(/won Streak Master with 120 days streak/i)).toBeInTheDocument();
      fireEvent.mouseLeave(card);
    }
  });
});
