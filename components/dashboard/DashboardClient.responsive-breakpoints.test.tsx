/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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

const mockSecondData = {
  ...baseInitialData,
  profile: {
    ...baseInitialData.profile,
    username: 'JhaSourav07',
    name: 'Sourav',
  },
};

describe('DashboardClient Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('root container has p-4 md:p-6 lg:p-8 classes for fluid responsive scaling padding', () => {
    const { container } = render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    const root = container.querySelector('#dashboard-root');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('p-4')).toBe(true);
    expect(root!.classList.contains('md:p-6')).toBe(true);
    expect(root!.classList.contains('lg:p-8')).toBe(true);
  });

  it('single profile grid uses grid-cols-1 lg:grid-cols-[300px_1fr_320px] responsive layouts', () => {
    const { container } = render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    // Look for the layout wrapper in single-profile mode
    const singleGrid = container.querySelector('.lg\\:grid-cols-\\[300px_1fr_320px\\]');
    expect(singleGrid).not.toBeNull();
    expect(singleGrid!.classList.contains('grid')).toBe(true);
    expect(singleGrid!.classList.contains('grid-cols-1')).toBe(true);
  });

  it('comparison mode grids configure columns for md:grid-cols-2 and lg:grid-cols-3 responsively', () => {
    const { container } = render(
      <DashboardClient
        initialData={baseInitialData}
        username="Mayank2905"
        compareData={mockSecondData}
        period={mockPeriod}
      />
    );

    // Head-to-Head stats should render in 3 columns on large screens
    const statsGrid = container.querySelector('.lg\\:grid-cols-3');
    expect(statsGrid).not.toBeNull();
    expect(statsGrid!.classList.contains('grid-cols-1')).toBe(true);
    expect(statsGrid!.classList.contains('md:grid-cols-2')).toBe(true);

    // Profile cards container in comparison mode should render 2 columns on medium screens
    const profilesGrid = container.querySelector('.md\\:grid-cols-2');
    expect(profilesGrid).not.toBeNull();
    expect(profilesGrid!.classList.contains('grid-cols-1')).toBe(true);
  });

  it('header actions bar has flex-wrap to stack items cleanly on smaller screens', () => {
    const { container } = render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    const actionsContainer = container.querySelector('#generate-dashboard-btn');
    expect(actionsContainer).not.toBeNull();
    expect(actionsContainer!.classList.contains('flex')).toBe(true);
    expect(actionsContainer!.classList.contains('flex-wrap')).toBe(true);
  });

  it('renders cleanly when matchMedia reports a 375px mobile viewport', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    render(
      <DashboardClient initialData={baseInitialData} username="Mayank2905" period={mockPeriod} />
    );

    expect(screen.getByTestId('profile-card')).toBeDefined();
    expect(screen.getByTestId('activity-landscape')).toBeDefined();
  });
});
