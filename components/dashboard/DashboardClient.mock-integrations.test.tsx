import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardClient, { DashboardData } from './DashboardClient';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

/* ---------------- MOCK next/navigation ---------------- */
vi.mock('./ProfileCard', () => ({
  default: () => <div>ProfileCard</div>,
}));

vi.mock('./Achievements', () => ({
  default: () => <div>Achievements</div>,
}));

vi.mock('./ActivityLandscape', () => ({
  default: () => <div>ActivityLandscape</div>,
}));

vi.mock('./LanguageChart', () => ({
  default: () => <div>LanguageChart</div>,
}));

vi.mock('./CommitClock', () => ({
  default: () => <div>CommitClock</div>,
}));

vi.mock('./HistoricalTrendView', () => ({
  default: () => <div>HistoricalTrendView</div>,
}));

vi.mock('./AIInsights', () => ({
  default: () => <div>AIInsights</div>,
}));

vi.mock('./StatsCard', () => ({
  default: () => <div>StatsCard</div>,
}));

vi.mock('./RepositoryGraph', () => ({
  default: () => <div>RepositoryGraph</div>,
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('./ResumeProfileSection', () => ({
  default: () => <div>ResumeProfileSection</div>,
}));

vi.mock('./PopularRepos', () => ({
  PopularRepos: () => <div>PopularRepos</div>,
}));

vi.mock('./RefreshButton', () => ({
  default: () => <button>Refresh</button>,
}));

vi.mock('./ProfileOptimizerModal', () => ({
  default: () => null,
}));
vi.mock('./Heatmap', () => ({
  default: () => <div>Heatmap</div>,
}));

vi.mock('./RadarChart', () => ({
  default: () => <div>RadarChart</div>,
}));

vi.mock('./GrowthTrendChart', () => ({
  default: () => <div>GrowthTrendChart</div>,
}));

vi.mock('./ComparisonStatsCard', () => ({
  default: () => <div>ComparisonStatsCard</div>,
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
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),

  useSearchParams: () => ({
    get: vi.fn(),
    toString: vi.fn(() => ''),
  }),

  usePathname: () => '/dashboard',
}));
/* ---------------- MOCK DATA ---------------- */
const mockDashboardData: DashboardData = {
  profile: {
    username: 'testuser',
    name: 'Test User',
    avatarUrl: 'https://github.com/testuser.png',
    isPro: false,
    bio: 'Test bio',
    location: 'India',
    joinedDate: '2024-01-01',
    developerScore: 75,
    stats: {
      repositories: 30,
      followers: 20,
      following: 10,
      stars: 100,
    },
  },

  stats: {
    currentStreak: 20,
    peakStreak: 35,
    totalContributions: 600,
  },

  languages: [
    {
      name: 'TypeScript',
      color: '#3178c6',
      percentage: 60,
    },
  ],

  activity: [
    {
      date: '2026-06-01',
      count: 5,
      intensity: 2,
    },
  ],

  insights: [
    {
      id: '1',
      icon: 'Sparkles',
      text: 'Great contributor',
    },
  ],

  achievements: [
    {
      id: 'a1',
      title: 'First Commit',
      description: 'Made first commit',
      icon: '🏆',
      isUnlocked: true,
      type: 'contributions',
      threshold: 1,
      currentValue: 1,
      progress: 100,
    },
  ],

  commitClock: [
    { day: 'Sun', commits: 1 },
    { day: 'Mon', commits: 2 },
    { day: 'Tue', commits: 3 },
    { day: 'Wed', commits: 4 },
    { day: 'Thu', commits: 5 },
    { day: 'Fri', commits: 6 },
    { day: 'Sat', commits: 7 },
  ],

  graphData: {
    nodes: [],
    links: [],
  },

  popularRepos: [],
  pinnedRepos: [],
};

/* ---------------- COMMON PERIOD ---------------- */
const mockPeriod: DashboardPeriod = {
  kind: 'year',
  label: '2025',
  from: '2025-01-01T00:00:00.000Z',
  to: '2025-12-31T23:59:59.999Z',
};

/* ---------------- TESTS ---------------- */
describe('DashboardClient - Mock Integration (Fixed)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
  const renderDashboard = () =>
    render(
      <DashboardClient username="testuser" initialData={mockDashboardData} period={mockPeriod} />
    );

  it('renders ProfileCard', () => {
    renderDashboard();
    expect(screen.getByText('ProfileCard')).toBeInTheDocument();
  });

  it('renders Achievements', () => {
    renderDashboard();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('renders ActivityLandscape', () => {
    renderDashboard();
    expect(screen.getByText('ActivityLandscape')).toBeInTheDocument();
  });

  it('renders AIInsights', () => {
    renderDashboard();
    expect(screen.getByText('AIInsights')).toBeInTheDocument();
  });

  it('renders RepositoryGraph', () => {
    renderDashboard();
    expect(screen.getByText('RepositoryGraph')).toBeInTheDocument();
  });
});
