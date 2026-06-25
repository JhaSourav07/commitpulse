import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AchievementCenter from './AchievementCenter';
import { DashboardData } from '@/types/dashboard';

// Mock framer-motion to prevent DOM warnings
vi.mock('framer-motion', () => ({
  motion: {
    div: (
      props: React.HTMLAttributes<HTMLDivElement> & {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
        whileInView?: unknown;
        viewport?: unknown;
        whileHover?: unknown;
      }
    ) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.whileHover;
      return <div {...cleanProps} />;
    },
  },
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.achievement_center.title': 'Open Source Achievement Center',
        'dashboard.achievement_center.subtitle': 'Celebrate milestones and track rewards.',
        'dashboard.achievement_center.streak_master': 'Streak Master',
        'dashboard.achievement_center.code_machine': 'Code Machine',
        'dashboard.achievement_center.collaborator': 'Core Collaborator',
        'dashboard.achievement_center.legend': 'Open Source Legend',
      };
      return translations[key] || key;
    },
  }),
}));

describe('AchievementCenter', () => {
  const mockData: DashboardData = {
    profile: {
      username: 'test-user',
      name: 'Test Contributor',
      avatarUrl: 'https://avatar.url',
      isPro: false,
      bio: 'Developer bio',
      location: 'Earth',
      joinedDate: '2024-01-01',
      developerScore: 80,
      stats: {
        repositories: 10,
        followers: 20,
        following: 15,
        stars: 30,
      },
    },
    stats: {
      currentStreak: 10, // Unlock Streak Master
      peakStreak: 15,
      totalContributions: 150, // Unlock Code Machine
    },
    languages: [],
    activity: [],
    insights: [],
    achievements: [],
    commitClock: [],
    graphData: { nodes: [], links: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, subtitle and badge grid items correctly', () => {
    render(<AchievementCenter data={mockData} />);

    expect(screen.getByText('Open Source Achievement Center')).toBeInTheDocument();

    // Badges grid container
    const grid = screen.getByTestId('badges-grid');
    expect(grid).toBeInTheDocument();

    // Verify unlocked badges are visible
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
    expect(screen.getByText('Code Machine')).toBeInTheDocument();
  });

  it('calculates unlocked count based on stats', () => {
    render(<AchievementCenter data={mockData} />);

    // Under mockData:
    // Total contributions = 150 -> Code Machine unlocked (>=100)
    // Streak = 10 -> Streak Master unlocked (>=7)
    // Repos = 10 -> Core Collaborator unlocked (>=5)
    // Stars = 30 and commits = 150 -> Open Source Legend remains locked (<200 commits)
    // Unlocked count should be 3/4
    expect(screen.getByText('3/4 Unlocked')).toBeInTheDocument();
  });
});
