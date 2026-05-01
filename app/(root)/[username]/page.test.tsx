/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardPage, { generateMetadata } from './page';
import { getFullDashboardData } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

// Mock the dashboard components to keep the test focused on the page rendering logic
vi.mock('@/components/dashboard/ProfileCard', () => ({
  default: () => <div data-testid="profile-card">ProfileCard</div>,
}));
vi.mock('@/components/dashboard/ActivityLandscape', () => ({
  default: () => <div data-testid="activity-landscape">ActivityLandscape</div>,
}));
vi.mock('@/components/dashboard/StatsCard', () => ({
  default: ({ title, value }: any) => (
    <div data-testid="stats-card">
      {title}: {value}
    </div>
  ),
}));
vi.mock('@/components/dashboard/LanguageChart', () => ({
  default: () => <div data-testid="language-chart">LanguageChart</div>,
}));
vi.mock('@/components/dashboard/CommitClock', () => ({
  default: () => <div data-testid="commit-clock">CommitClock</div>,
}));
vi.mock('@/components/dashboard/Heatmap', () => ({
  default: () => <div data-testid="heatmap">Heatmap</div>,
}));
vi.mock('@/components/dashboard/AIInsights', () => ({
  default: () => <div data-testid="ai-insights">AIInsights</div>,
}));
vi.mock('@/components/dashboard/Achievements', () => ({
  default: () => <div data-testid="achievements">Achievements</div>,
}));

describe('DashboardPage', () => {
  const mockData = {
    profile: {
      username: 'octocat',
      name: 'The Octocat',
      avatarUrl: 'avatar.png',
      isPro: true,
      bio: 'Hello world',
      location: 'Earth',
      joinedDate: 'Jan 2020',
      developerScore: 90,
      stats: { repositories: 10, followers: 20, following: 5, stars: 100 },
    },
    stats: {
      currentStreak: 5,
      peakStreak: 15,
      totalContributions: 500,
    },
    languages: [{ name: 'TypeScript', percentage: 100, color: '#3178c6' }],
    activity: [],
    insights: [],
    commitClock: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFullDashboardData).mockResolvedValue(mockData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateMetadata', () => {
    it('generates correct metadata for a given user', async () => {
      const metadata = await generateMetadata({ params: Promise.resolve({ username: 'octocat' }) });

      expect(metadata.title).toBe("octocat's Commit Pulse");
      expect(metadata.description).toContain("octocat's GitHub contribution pulse");
      expect((metadata.openGraph?.images as any[])?.[0].url).toContain('api/og?username=octocat');
    });
  });

  describe('DashboardPage rendering', () => {
    it('renders the dashboard components with the fetched data', async () => {
      const PageContent = await DashboardPage({ params: Promise.resolve({ username: 'octocat' }) });
      render(PageContent);

      // Verify data fetching
      expect(getFullDashboardData).toHaveBeenCalledWith('octocat');

      // Verify layout and component presence
      expect(screen.getByText('Generate Your Own Dashboard')).toBeDefined();
      expect(screen.getByTestId('profile-card')).toBeDefined();
      expect(screen.getByTestId('activity-landscape')).toBeDefined();
      expect(screen.getByTestId('language-chart')).toBeDefined();
      expect(screen.getByTestId('commit-clock')).toBeDefined();
      expect(screen.getByTestId('heatmap')).toBeDefined();
      expect(screen.getByTestId('ai-insights')).toBeDefined();
      expect(screen.getByTestId('achievements')).toBeDefined();

      // Verify stats cards mapped correctly
      expect(screen.getByText('Current Streak: 5')).toBeDefined();
      expect(screen.getByText('Peak Streak: 15')).toBeDefined();
      expect(screen.getByText('Contributions: 500')).toBeDefined();
    });
  });
});
