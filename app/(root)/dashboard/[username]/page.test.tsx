/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardPage, { generateMetadata } from './page';
import { getFullDashboardData } from '@/lib/github';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),

  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

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
  default: ({ data }: { data: unknown[] }) => (
    <div data-testid="heatmap" data-prop={JSON.stringify(data)}>
      Heatmap
    </div>
  ),
}));

vi.mock('@/components/dashboard/AIInsights', () => ({
  default: () => <div data-testid="ai-insights">AIInsights</div>,
}));

vi.mock('@/components/dashboard/Achievements', () => ({
  default: () => <div data-testid="achievements">Achievements</div>,
}));

vi.mock('@/components/dashboard/RefreshButton', () => ({
  default: () => <div data-testid="refresh-button">RefreshButton</div>,
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
    achievements: [],
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
      const username = 'octocat';
      const metadata = await generateMetadata({
        params: Promise.resolve({ username }),
      });

      const openGraphImage = (metadata.openGraph?.images as any[])?.[0];

      expect(metadata.title).toBe("octocat's Commit Pulse");
      expect(metadata.description).toContain("octocat's GitHub contribution pulse");
      expect(openGraphImage.url).toContain('api/og?username=octocat');
      expect(openGraphImage.width).toBe(1200);
      expect(openGraphImage.height).toBe(630);
      expect(openGraphImage.alt).toContain(username);
      expect((metadata.twitter as any)?.card).toBe('summary_large_image');
    });
  });

  describe('DashboardPage rendering', () => {
    it('renders the dashboard components with the fetched data', async () => {
      const PageContent = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({}),
      });

      render(PageContent);

      expect(getFullDashboardData).toHaveBeenCalledWith('octocat', {
        bypassCache: false,
      });

      const generateLink = screen.getByText('Generate Your Own Dashboard').closest('a');
      expect(generateLink).toBeDefined();
      expect(generateLink?.getAttribute('href')).toBe('/');
      expect(screen.getByTestId('profile-card')).toBeDefined();
      expect(screen.getByTestId('activity-landscape')).toBeDefined();
      expect(screen.getByTestId('language-chart')).toBeDefined();
      expect(screen.getByTestId('commit-clock')).toBeDefined();
      expect(screen.getByTestId('heatmap')).toBeDefined();
      expect(screen.getByTestId('ai-insights')).toBeDefined();
      expect(screen.getByTestId('achievements')).toBeDefined();
      expect(screen.getAllByTestId('stats-card')).toHaveLength(3);
      expect(screen.getByText('Current Streak: 5')).toBeDefined();
      expect(screen.getByText('Peak Streak: 15')).toBeDefined();
      expect(screen.getByText('Contributions: 500')).toBeDefined();
    });

    it('calls getFullDashboardData with bypassCache: true when refresh param is set', async () => {
      const PageContent = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({ refresh: 'true' }),
      });

      render(PageContent);

      expect(getFullDashboardData).toHaveBeenCalledWith('octocat', {
        bypassCache: true,
      });
    });
  });
  it('passes the correct activity data to Heatmap', async () => {
    const PageContent = await DashboardPage({
      params: Promise.resolve({ username: 'octocat' }),
      searchParams: Promise.resolve({}),
    });

    render(PageContent);

    const heatmap = screen.getByTestId('heatmap');
    expect(JSON.parse(heatmap.getAttribute('data-prop') ?? '[]')).toEqual(mockData.activity);
  });
});
