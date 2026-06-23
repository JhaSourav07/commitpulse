import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContributionImpactAnalyzer from './ContributionImpactAnalyzer';
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
      }
    ) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      return <div {...cleanProps} />;
    },
  },
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.impact_analyzer.title': 'Contribution Impact Analyzer',
        'dashboard.impact_analyzer.subtitle': 'Measure total code and repository footprint score.',
        'dashboard.impact_analyzer.grade': 'Contribution Grade',
        'dashboard.impact_analyzer.breakdown': 'Impact Breakdown',
        'dashboard.impact_analyzer.code_footprint': 'Code Footprint',
        'dashboard.impact_analyzer.issue_resolution': 'Issue/PR Activity',
        'dashboard.impact_analyzer.collaboration': 'Collaboration Density',
        'dashboard.impact_analyzer.community_influence': 'Community Influence',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ContributionImpactAnalyzer', () => {
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
      currentStreak: 5,
      peakStreak: 10,
      totalContributions: 150,
    },
    languages: [],
    activity: [
      { date: '2026-06-01', count: 10, intensity: 2 },
    ],
    insights: [],
    achievements: [],
    commitClock: [],
    graphData: { nodes: [], links: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, subtitle and rating grade correctly', () => {
    render(<ContributionImpactAnalyzer data={mockData} />);

    expect(screen.getByText('Contribution Impact Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Contribution Grade')).toBeInTheDocument();
    
    // Impact calculations should output a grade (like A, B, C, A+)
    const gradeBadge = screen.getByText(/^D$/);
    expect(gradeBadge).toBeInTheDocument();
  });
});
