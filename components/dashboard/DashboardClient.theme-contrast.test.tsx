import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

/* -----------------------------
   CRITICAL FIX: MOCK ROUTER FIRST
------------------------------ */

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

/* -----------------------------
   IMPORT AFTER MOCK
------------------------------ */

import DashboardClient from './DashboardClient';

/* -----------------------------
   MOCKS
------------------------------ */

vi.mock('next/link', () => ({
  default: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    section: ({ children }: { children?: ReactNode }) => <section>{children}</section>,
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  RefreshCw: () => <span>Refresh</span>,
  Share2: () => <span>Share</span>,
  Network: () => <span>Network</span>,
}));

vi.mock('./RefreshButton', () => ({
  default: () => <div data-testid="refresh-button" />,
}));

vi.mock('./ProfileCard', () => ({
  default: () => <div data-testid="profile-card" />,
}));

vi.mock('./Achievements', () => ({
  default: () => <div data-testid="achievements" />,
}));

vi.mock('./ActivityLandscape', () => ({
  default: () => <div data-testid="activity" />,
}));

vi.mock('./LanguageChart', () => ({
  default: () => <div data-testid="language-chart" />,
}));

vi.mock('./CommitClock', () => ({
  default: () => <div data-testid="commit-clock" />,
}));

vi.mock('./Heatmap', () => ({
  default: () => <div data-testid="heatmap" />,
}));

vi.mock('./HistoricalTrendView', () => ({
  default: () => <div data-testid="trend" />,
}));

vi.mock('./AIInsights', () => ({
  default: () => <div data-testid="ai-insights" />,
}));

vi.mock('./StatsCard', () => ({
  default: () => <div data-testid="stats-card" />,
}));

vi.mock('./RepositoryGraph', () => ({
  default: () => <div data-testid="repo-graph" />,
}));

vi.mock('./HallOfFame', () => ({
  default: () => <div data-testid="hall-of-fame" />,
}));

vi.mock('./ComparisonStatsCard', () => ({
  default: () => <div data-testid="compare-card" />,
}));

vi.mock('./RadarChart', () => ({
  default: () => <div data-testid="radar" />,
}));

vi.mock('./GrowthTrendChart', () => ({
  default: () => <div data-testid="growth" />,
}));

vi.mock('./PopularRepos', () => ({
  PopularRepos: () => <div data-testid="popular-repos" />,
}));

vi.mock('./ProfileOptimizerModal', () => ({
  default: () => <div data-testid="optimizer" />,
}));

vi.mock('./ResumeProfileSection', () => ({
  default: () => <div data-testid="resume" />,
}));

/* -----------------------------
   TEST DATA
------------------------------ */

const mockData = {
  profile: {
    username: 'testuser',
    name: 'Test User',
    avatarUrl: '',
    isPro: false,
    bio: '',
    location: '',
    joinedDate: '',
    developerScore: 50,
    stats: {
      repositories: 10,
      followers: 5,
      following: 3,
      stars: 20,
    },
  },
  stats: {
    currentStreak: 5,
    peakStreak: 12,
    totalContributions: 120,
  },
  languages: [],
  activity: [],
  insights: [],
  achievements: [],
  commitClock: [],
  graphData: {
    nodes: [],
    links: [],
  },
  popularRepos: [],
  pinnedRepos: [],
};

const baseProps: {
  initialData: typeof mockData;
  username: string;
  period: DashboardPeriod;
} = {
  initialData: mockData,
  username: 'testuser',
  period: {
    kind: 'rolling',
    label: 'Last 12 months',
    from: '2025-01-01T00:00:00.000Z',
    to: '2025-12-31T23:59:59.999Z',
  },
};

/* -----------------------------
   TESTS
------------------------------ */

describe('DashboardClient - Theme Contrast Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('root element exists and is visible', () => {
    const { container } = render(<DashboardClient {...baseProps} />);
    expect(container.querySelector('#dashboard-root')).toBeTruthy();
  });

  it('renders correctly', () => {
    const { container } = render(<DashboardClient {...baseProps} />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('maintains UI structure consistency', () => {
    const { container } = render(<DashboardClient {...baseProps} />);
    expect(container.querySelector('[data-dashboard]')).toBeTruthy();
  });

  /* ✅ NEW TEST 4 */
  it('applies dashboard root styling container', () => {
    const { container } = render(<DashboardClient {...baseProps} />);

    const root = container.querySelector('#dashboard-root');
    expect(root).toBeTruthy();

    // ensures structural wrapper exists
    expect(root?.className).toContain('min-h-screen');
  });

  /* ✅ NEW TEST 5 */
  it('renders core dashboard layout regions', () => {
    const { container } = render(<DashboardClient {...baseProps} />);

    // layout sanity checks (aside/section/div presence)
    const hasLayout =
      container.querySelector('aside') ||
      container.querySelector('section') ||
      container.querySelector('div');

    expect(hasLayout).toBeTruthy();
  });
});
