/* eslint-disable @typescript-eslint/no-explicit-any */
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
    graphData: { nodes: [], links: [] },
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

      const openGraphImage = (metadata.openGraph?.images as any[])?.[0];

      expect(metadata.title).toBe("octocat's Commit Pulse");
      expect(metadata.description).toContain("octocat's GitHub contribution pulse");
      const url = openGraphImage.url;
      expect(url).toContain('api/og?');
      expect(url).toContain('user=octocat');
      expect(url).toContain('theme=neon');
      expect(url).toContain('bg=000000');
      expect(url).toContain('text=00ff00');
      expect(url).toContain('accent=ff00ff');
      expect(url).not.toContain('ignoredArray');
      expect(url).not.toContain('ignoredUndefined');
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
      const PageContent = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({ year: '2024' }),
      });

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
      const PageContent = await DashboardPage({
        params: Promise.resolve({ username: 'octocat' }),
        searchParams: Promise.resolve({}),
      });

      render(PageContent);

      const trendView = screen.getByTestId('historical-trend-view');
      expect(JSON.parse(trendView.getAttribute('data-prop') ?? '[]')).toEqual(mockData.activity);
    });

    it('calls notFound when dashboard data fetch throws an error', async () => {
      vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('User not found'));

      await DashboardPage({
        params: Promise.resolve({ username: 'missing-user' }),
        searchParams: Promise.resolve({}),
      });

      expect(mockNotFound).toHaveBeenCalledOnce();
    });
  });
});
