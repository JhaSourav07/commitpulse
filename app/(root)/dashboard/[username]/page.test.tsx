import type { Metadata } from 'next';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardPage, { generateMetadata } from './page';
import { getFullDashboardData } from '@/lib/github';

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: mockNotFound,
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

// --- Mocking Core UI Blocks ---
vi.mock('@/components/dashboard/ProfileCard', () => ({
  default: () => <div data-testid="profile-card">ProfileCard</div>,
}));

vi.mock('@/components/dashboard/ActivityLandscape', () => ({
  default: () => <div data-testid="activity-landscape">ActivityLandscape</div>,
}));

type ContributionInsightsPanelProps = {
  stats: {
    currentStreak: number;
    peakStreak: number;
    totalContributions: number;
  };
};

vi.mock('@/components/dashboard/ContributionInsightsPanel', () => ({
  default: ({ stats }: ContributionInsightsPanelProps) => (
    <div data-testid="contribution-insights-panel">
      <div>Current Streak: {stats.currentStreak}</div>
      <div>Peak Streak: {stats.peakStreak}</div>
      <div>Contributions: {stats.totalContributions}</div>
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

vi.mock('@/components/dashboard/HistoricalTrendView', () => ({
  default: ({ period, activity }: { period: { label: string }; activity: unknown[] }) => (
    <div data-testid="historical-trend-view" data-prop={JSON.stringify(activity)}>
      {period.label}
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

// --- Insulate Complex Client-Side Components (Canvas, D3, Browser API dependencies) ---
vi.mock('@/components/dashboard/PopularPinnnedRepos', () => ({
  PopularRepos: () => <div data-testid="popular-repos-mock">PopularPinnedRepos</div>,
}));

vi.mock('@/components/dashboard/RepositoryGraph', () => ({
  default: () => <div data-testid="repository-graph-mock">RepositoryGraph</div>,
}));

vi.mock('@/components/dashboard/HallOfFame', () => ({
  default: () => <div data-testid="hall-of-fame-mock">HallOfFame</div>,
}));

vi.mock('@/components/dashboard/RadarChart', () => ({
  default: () => <div data-testid="radar-chart-mock">RadarChart</div>,
}));

vi.mock('@/components/dashboard/GrowthTrendChart', () => ({
  default: () => <div data-testid="growth-trend-chart-mock">GrowthTrendChart</div>,
}));

vi.mock('@/components/dashboard/ProfileOptimizerModal', () => ({
  default: () => <div data-testid="profile-optimizer-modal-mock">ProfileOptimizerModal</div>,
}));

vi.mock('@/components/dashboard/ResumeProfileSection', () => ({
  default: () => <div data-testid="resume-profile-section-mock">ResumeProfileSection</div>,
}));

vi.mock('@/components/dashboard/PRInsights/PRInsightsClient', () => ({
  default: () => <div data-testid="pr-insights-client-mock">PRInsightsClient</div>,
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
      codingHabit: 'Night Owl',
      totalPRs: 10,
      totalIssues: 5,
      totalReviews: 3,
    },
    languages: [{ name: 'TypeScript', percentage: 100, color: '#3178c6' }],
    activity: [],
    insights: [],
    achievements: [],
    commitClock: [],
    graphData: { nodes: [], links: [] },
    lastSyncedAt: undefined,
    popularRepos: [],
    pinnedRepos: [],
    starredRepos: [],
    deployments: [],
    hallOfFame: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFullDashboardData).mockResolvedValue(mockData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateMetadata', () => {
    it('generates correct metadata for a given user and forwards valid searchParams', async () => {
      const username = 'octocat';
      const metadata = await generateMetadata({
        params: Promise.resolve({ username }),
        searchParams: Promise.resolve({
          theme: 'neon',
          bg: '000000',
          text: '00ff00',
          accent: 'ff00ff',
          ignoredArray: ['a', 'b'],
          ignoredUndefined: undefined,
        }),
      });

      const openGraphImages = metadata.openGraph?.images as Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
      }>;
      const openGraphImage = openGraphImages?.[0];

      expect(metadata.title).toBe("octocat's Commit Pulse");
      expect(metadata.description).toContain("octocat's GitHub contribution pulse");

      // Fixed: Strict Type-safe navigation mapping
      expect(openGraphImage).toBeDefined();
      const url = openGraphImage!.url;

      expect(url).toContain('api/og?');
      expect(url).toContain('user=octocat');
      expect(url).toContain('theme=neon');
      expect(url).toContain('bg=000000');
      expect(url).toContain('text=00ff00');
      expect(url).toContain('accent=ff00ff');
      expect(url).not.toContain('ignoredArray');
      expect(url).not.toContain('ignoredUndefined');
      expect(openGraphImage!.width).toBe(1200);
      expect(openGraphImage!.height).toBe(630);
      expect(openGraphImage!.alt).toContain(username);
      expect((metadata.twitter as Metadata['twitter'] & { card?: string })?.card).toBe(
        'summary_large_image'
      );
    });
  });

  describe('DashboardPage rendering', () => {
    it('renders the dashboard components with the fetched data', async () => {
      const SuspenseTree = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({}),
      });
      const DashboardContent = SuspenseTree.props.children.type;
      const PageContent = await DashboardContent(SuspenseTree.props.children.props);

      render(PageContent);

      expect(getFullDashboardData).toHaveBeenCalledWith(
        'octocat',
        expect.objectContaining({
          bypassCache: false,
          from: expect.any(String),
          to: expect.any(String),
          rangeLabel: 'Last 12 months',
        })
      );

      const generateLink = screen.getByText('Generate Your Own').closest('a');
      expect(generateLink).toBeDefined();
      expect(generateLink?.getAttribute('href')).toBe('/');
      expect(screen.getByTestId('profile-card')).toBeDefined();
      expect(screen.getByTestId('activity-landscape')).toBeDefined();
      expect(screen.getByTestId('language-chart')).toBeDefined();
      expect(screen.getByTestId('commit-clock')).toBeDefined();
      expect(screen.getByTestId('historical-trend-view')).toBeDefined();
      expect(screen.getByTestId('ai-insights')).toBeDefined();
      expect(screen.getByTestId('achievements')).toBeDefined();
      expect(screen.getByTestId('contribution-insights-panel')).toBeDefined();
      expect(screen.getByText('Current Streak: 5')).toBeDefined();
      expect(screen.getByText('Peak Streak: 15')).toBeDefined();
      expect(screen.getByText('Contributions: 500')).toBeDefined();
    });

    it('calls getFullDashboardData with bypassCache: true when refresh param is set', async () => {
      const SuspenseTree = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({ refresh: 'true' }),
      });
      const DashboardContent = SuspenseTree.props.children.type;
      const PageContent = await DashboardContent(SuspenseTree.props.children.props);

      render(PageContent);

      expect(getFullDashboardData).toHaveBeenCalledWith(
        'octocat',
        expect.objectContaining({
          bypassCache: true,
          from: expect.any(String),
          to: expect.any(String),
          rangeLabel: 'Last 12 months',
        })
      );
    });

    it('passes a calendar-year query through to getFullDashboardData', async () => {
      const SuspenseTree = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({ year: '2024' }),
      });
      const DashboardContent = SuspenseTree.props.children.type;
      const PageContent = await DashboardContent(SuspenseTree.props.children.props);

      render(PageContent);

      expect(getFullDashboardData).toHaveBeenCalledWith(
        'octocat',
        expect.objectContaining({
          bypassCache: false,
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-12-31T23:59:59.999Z',
          rangeLabel: '2024',
        })
      );
    });

    it('passes the correct activity data to the historical trend view', async () => {
      const SuspenseTree = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({}),
      });
      const DashboardContent = SuspenseTree.props.children.type;
      const PageContent = await DashboardContent(SuspenseTree.props.children.props);

      render(PageContent);

      const trendView = screen.getByTestId('historical-trend-view');
      expect(JSON.parse(trendView.getAttribute('data-prop') ?? '[]')).toEqual(mockData.activity);
    });

    it('calls notFound when dashboard data fetch throws an error', async () => {
      vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('User not found'));

      const SuspenseTree = await DashboardPage({
        params: Promise.resolve({ username: 'missing-user' }),
        searchParams: Promise.resolve({}),
      });
      const DashboardContent = SuspenseTree.props.children.type;
      await DashboardContent(SuspenseTree.props.children.props);

      expect(mockNotFound).toHaveBeenCalledOnce();
    });
  });
});
