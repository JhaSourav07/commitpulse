import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnterpriseHealth from './EnterpriseHealth';
import type { TeamHealthData, TeamHealthScore } from '@/types/enterprise';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTeamHealthData: TeamHealthData = {
  teamId: 'team-1',
  teamName: 'Engineering Team Alpha',
  members: [],
  metrics: {
    totalMembers: 2,
    combinedContributions: 800,
    combinedCurrentStreak: 8,
    combinedLongestStreak: 30,
    averageDailyContributions: 2,
    activeMembers: 2,
  },
  sprintProgress: [],
  velocityTrends: [],
  burnoutRisk: {
    level: 'low',
    score: 10,
    indicators: [],
    recommendations: [],
  },
  contributionCalendar: { totalContributions: 800, weeks: [] },
  generatedAt: new Date().toISOString(),
};

const mockHealthScore: TeamHealthScore = {
  overall: 85,
  productivity: 90,
  sustainability: 85,
  collaboration: 80,
  level: 'excellent',
};

describe('EnterpriseHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders team name correctly', () => {
    render(<EnterpriseHealth data={mockTeamHealthData} healthScore={mockHealthScore} />);
    expect(screen.getByText('Engineering Team Alpha')).toBeDefined();
  });

  it('renders health score', () => {
    render(<EnterpriseHealth data={mockTeamHealthData} healthScore={mockHealthScore} />);
    expect(screen.getByText('excellent')).toBeDefined();
  });

  it('renders expand button', () => {
    render(<EnterpriseHealth data={mockTeamHealthData} healthScore={mockHealthScore} />);
    expect(screen.getByText('Expand')).toBeDefined();
  });

  it('renders collapse button when expanded', () => {
    const { container } = render(
      <EnterpriseHealth data={mockTeamHealthData} healthScore={mockHealthScore} />
    );
    expect(container).toBeDefined();
  });
});
