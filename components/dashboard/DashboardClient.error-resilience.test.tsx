/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DashboardClient from './DashboardClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;
      delete props.whileHover;

      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('./RefreshButton', () => ({
  default: () => <button data-testid="refresh-button">Refresh</button>,
}));

vi.mock('./ProfileCard', () => ({
  default: ({ user }: any) => (
    <div data-testid="profile-card">
      <div>{user.name}</div>
    </div>
  ),
}));

vi.mock('./Achievements', () => ({
  default: () => <div data-testid="achievements">Achievements</div>,
}));

vi.mock('./ActivityLandscape', () => ({
  default: () => <div data-testid="activity-landscape">Activity Landscape</div>,
}));

vi.mock('./LanguageChart', () => ({
  default: () => <div data-testid="language-chart">Language Chart</div>,
}));

vi.mock('./CommitClock', () => ({
  default: () => <div data-testid="commit-clock">Commit Clock</div>,
}));

vi.mock('./Heatmap', () => ({
  default: () => <div data-testid="heatmap">Heatmap</div>,
}));

vi.mock('./HistoricalTrendView', () => ({
  default: () => <div data-testid="historical-trend-view">Historical Trend</div>,
}));

vi.mock('./AIInsights', () => ({
  default: () => <div data-testid="ai-insights">AI Insights</div>,
}));

vi.mock('./StatsCard', () => ({
  default: ({ title }: any) => <div data-testid={`stats-card-${title}`}>{title}</div>,
}));

vi.mock('./RepositoryGraph', () => ({
  default: () => <div data-testid="repository-graph">Repository Graph</div>,
}));

vi.mock('./PopularPinnnedRepos', () => ({
  PopularRepos: () => <div data-testid="popular-repos">Popular Repos</div>,
}));

vi.mock('./ResumeProfileSection', () => ({
  default: () => <div data-testid="resume-profile-section">Resume Profile</div>,
}));

vi.mock('./ProfileOptimizerModal', () => ({
  default: () => <div data-testid="profile-optimizer-modal" />,
}));

vi.mock('./ComparisonStatsCard', () => ({
  default: ({ title }: any) => <div data-testid={`comparison-stats-${title}`}>{title}</div>,
}));

vi.mock('./RadarChart', () => ({
  default: () => <div data-testid="radar-chart">Radar Chart</div>,
}));

vi.mock('./GrowthTrendChart', () => ({
  default: () => <div data-testid="growth-trend-chart">Growth Trend Chart</div>,
}));

const mockPeriod = {
  kind: 'year' as const,
  label: '2026',
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-12-31T23:59:59.999Z',
  year: '2026',
};

const baseInitialData = {
  profile: {
    username: 'Mayank2905',
    name: 'Mayank',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    isPro: false,
    bio: 'Software Developer',
    location: 'India',
    joinedDate: '2020-01-01',
    developerScore: 85,
    stats: {
      repositories: 30,
      followers: 120,
      following: 80,
      stars: 45,
    },
  },
  stats: {
    currentStreak: 5,
    peakStreak: 35,
    totalContributions: 600,
  },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percentage: 60 },
    { name: 'Python', color: '#3572A5', percentage: 40 },
  ],
  activity: [
    { date: '2026-05-01', count: 5, intensity: 1 as const },
    { date: '2026-05-02', count: 0, intensity: 0 as const },
  ],
  insights: [{ id: '1', icon: 'zap', text: 'Highly active' }],
  achievements: [],
  commitClock: [],
  graphData: { nodes: [], links: [] },
  popularRepos: [],
  pinnedRepos: [],
};

describe('DashboardClient Exception safety, Hydration Stability & Error Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('verify initialization stability: handles undefined insights and popularRepos lists gracefully', () => {
    const malformedData = {
      ...baseInitialData,
      insights: undefined as any,
      popularRepos: undefined,
      pinnedRepos: undefined,
    };
    render(
      <DashboardClient initialData={malformedData} username="Mayank2905" period={mockPeriod} />
    );
    expect(screen.getByTestId('profile-card')).toBeDefined();
    expect(screen.getByTestId('ai-insights')).toBeDefined();
  });

  it('verify comparison fetch failure exception safety: displays the network error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    fireEvent.click(screen.getByText('Compare Profile'));
    fireEvent.change(screen.getByPlaceholderText('Enter GitHub Username'), {
      target: { value: 'JhaSourav07' },
    });
    fireEvent.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeDefined();
    });
  });

  it('verify comparison non-ok response handling: displays custom server error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Rate limit exceeded' }),
      })
    );

    render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    fireEvent.click(screen.getByText('Compare Profile'));
    fireEvent.change(screen.getByPlaceholderText('Enter GitHub Username'), {
      target: { value: 'JhaSourav07' },
    });
    fireEvent.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(screen.getByText(/Rate limit exceeded/i)).toBeDefined();
    });
  });

  it('verify invalid JSON response body resilience: displays fallback error parsing message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token < in JSON')),
      })
    );

    render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    fireEvent.click(screen.getByText('Compare Profile'));
    fireEvent.change(screen.getByPlaceholderText('Enter GitHub Username'), {
      target: { value: 'JhaSourav07' },
    });
    fireEvent.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(screen.getByText(/Unexpected token </i)).toBeDefined();
    });
  });

  it('verify transition state boundary safety: switches between single profile and compare mode safely', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...baseInitialData,
        profile: { ...baseInitialData.profile, name: 'Sourav', username: 'JhaSourav07' },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    // Initial state: single mode
    expect(screen.queryByText('Exit Compare Mode')).toBeNull();

    // Trigger compare
    fireEvent.click(screen.getByText('Compare Profile'));
    fireEvent.change(screen.getByPlaceholderText('Enter GitHub Username'), {
      target: { value: 'JhaSourav07' },
    });
    fireEvent.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(screen.getByText('Exit Compare Mode')).toBeDefined();
    });

    // Exit compare
    fireEvent.click(screen.getByText('Exit Compare Mode'));
    expect(screen.getByText('Compare Profile')).toBeDefined();
  });
});
