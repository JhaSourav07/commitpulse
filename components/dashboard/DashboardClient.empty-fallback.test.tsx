/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
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

const renderDashboard = (overrides = {}) => {
  return render(
    <DashboardClient
      initialData={{ ...baseInitialData, ...overrides }}
      username="Mayank2905"
      period={mockPeriod}
    />
  );
};

describe('DashboardClient empty fallback states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with an empty languages array without crashing', () => {
    renderDashboard({ languages: [] });

    expect(screen.getByTestId('profile-card')).toBeDefined();
    expect(screen.getByTestId('language-chart')).toBeDefined();
  });

  it('renders with an empty activity array without crashing', () => {
    renderDashboard({ activity: [] });

    expect(screen.getByTestId('activity-landscape')).toBeDefined();
    expect(screen.getByTestId('historical-trend-view')).toBeDefined();
  });

  it('renders with an empty insights array without runtime errors', () => {
    renderDashboard({ insights: [] });

    expect(screen.getByTestId('ai-insights')).toBeDefined();
  });

  it('renders with an empty achievements array and preserves layout', () => {
    renderDashboard({ achievements: [] });

    expect(screen.getByTestId('achievements')).toBeDefined();
    expect(screen.getByTestId('resume-profile-section')).toBeDefined();
  });

  it('renders all core dashboard sections when multiple collections are empty', () => {
    renderDashboard({
      languages: [],
      activity: [],
      insights: [],
      achievements: [],
      commitClock: [],
      popularRepos: [],
      pinnedRepos: [],
      graphData: { nodes: [], links: [] },
    });

    expect(screen.getByTestId('profile-card')).toBeDefined();
    expect(screen.getByTestId('achievements')).toBeDefined();
    expect(screen.getByTestId('activity-landscape')).toBeDefined();
    expect(screen.getByTestId('language-chart')).toBeDefined();
    expect(screen.getByTestId('commit-clock')).toBeDefined();
    expect(screen.getByTestId('historical-trend-view')).toBeDefined();
    expect(screen.getByTestId('ai-insights')).toBeDefined();
    expect(screen.getByTestId('popular-repos')).toBeDefined();
    expect(screen.getByTestId('repository-graph')).toBeDefined();
  });
});
