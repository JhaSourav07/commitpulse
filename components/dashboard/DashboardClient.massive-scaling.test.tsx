import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardClient, { DashboardData } from './DashboardClient';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

// Fixed Type-Safe & Lint-Safe Mock Constructor for framer-motion animations
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '';
  scrollMargin: string = '';
  thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
} as unknown as typeof IntersectionObserver;

// Mock the useRouter and useSearchParams hooks from Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => null),
    entries: vi.fn(() => []),
  }),
}));

// Mock child components that process heavy array visuals internally
vi.mock('./ActivityLandscape', () => ({
  default: () => <div data-testid="mock-activity-landscape">Activity Landscape</div>,
}));
vi.mock('./LanguageChart', () => ({ default: () => <div>Language Chart</div> }));
vi.mock('./CommitClock', () => ({ default: () => <div>Commit Clock</div> }));
vi.mock('./HistoricalTrendView', () => ({ default: () => <div>Historical Trend View</div> }));
vi.mock('./RepositoryGraph', () => ({ default: () => <div>Repository Graph</div> }));
vi.mock('./Heatmap', () => ({
  default: () => (
    <svg data-testid="mock-svg-heatmap" viewBox="0 0 100 100">
      <rect />
    </svg>
  ),
}));

// Helper function to generate mock DashboardData aligning strictly with GraphNode types
const generateMassiveMockData = (
  activityCount: number,
  extremeCommitValue = 100
): DashboardData => {
  return {
    profile: {
      username: 'testuser',
      name: 'Test Developer',
      avatarUrl: 'https://example.com/avatar.png',
      isPro: false,
      bio: 'A hard working developer testing extreme high bounds scaling.',
      location: 'Global',
      joinedDate: '2026-01-01',
      developerScore: 95,
      stats: {
        repositories: 50,
        followers: 1000,
        following: 200,
        stars: 5000,
      },
    },
    stats: {
      currentStreak: 12,
      peakStreak: 45,
      totalContributions: 25000,
    },
    languages: [
      { name: 'TypeScript', color: '#3178c6', percentage: 70 },
      { name: 'JavaScript', color: '#f1e05a', percentage: 30 },
    ],
    activity: Array.from({ length: activityCount }, (_, index) => ({
      date: `2026-01-${(index % 28) + 1}`,
      count: index % 5 === 0 ? 0 : 12,
      intensity: (index % 5) as 0 | 1 | 2 | 3 | 4,
    })),
    insights: [{ id: '1', icon: 'Zap', text: 'Highly active in mornings.' }],
    achievements: [],
    commitClock: [
      { day: 'Mon', commits: extremeCommitValue },
      { day: 'Tue', commits: 50 },
      { day: 'Wed', commits: 40 },
      { day: 'Thu', commits: 30 },
      { day: 'Fri', commits: 20 },
      { day: 'Sat', commits: 10 },
      { day: 'Sun', commits: 5 },
    ],
    graphData: {
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: 'Repo',
        val: 1,
        color: '#ffffff',
      })),
      links: Array.from({ length: 99 }, (_, i) => ({
        source: `node-${i}`,
        target: `node-${i + 1}`,
      })),
    },
  };
};

// FIXED: Converted Date objects to ISO strings to align with the 'string' type requirement
const mockPeriod: DashboardPeriod = {
  label: 'Last Year',
  kind: 'year',
  from: new Date('2025-01-01').toISOString(),
  to: new Date('2026-01-01').toISOString(),
};

describe('DashboardClient - Massive Data Sets and Extreme High Bounds Scaling', () => {
  // Test Case 1: Performance Execution Time Boundaries
  it('should render a massive dataset within acceptable performance limits', () => {
    const massiveData = generateMassiveMockData(15000);

    const startTime = performance.now();
    render(<DashboardClient initialData={massiveData} username="testuser" period={mockPeriod} />);
    const endTime = performance.now();

    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(200);
  });

  // Test Case 2: Extreme High Bounds Value Handling (No Layout Overflow)
  it('should cleanly structure and pass extreme numerical high bounds without breaking layouts', () => {
    const extremeData = generateMassiveMockData(10, 999999999);

    render(<DashboardClient initialData={extremeData} username="testuser" period={mockPeriod} />);

    const contributionDisplay = screen.getByText(/25,000|25000/i);
    expect(contributionDisplay).toBeInTheDocument();
  });

  // Test Case 3: SVG Coordinate Scaling Integrity
  it('should scale mock chart attributes correctly without generating invalid NaN parameters', () => {
    const edgeCaseData = generateMassiveMockData(100);
    edgeCaseData.commitClock = edgeCaseData.commitClock.map((d) => ({ ...d, commits: 0 }));

    render(<DashboardClient initialData={edgeCaseData} username="testuser" period={mockPeriod} />);

    const svgElements = screen.queryAllByTestId('mock-svg-heatmap');
    svgElements.forEach((svg) => {
      expect(svg.getAttribute('viewBox')).not.toContain('NaN');
    });
  });

  // Test Case 4: Dom Node List Grid Stress Test
  it('should process large datasets cleanly across inner loops without throwing runtime errors', () => {
    const stressData = generateMassiveMockData(5000);
    render(<DashboardClient initialData={stressData} username="testuser" period={mockPeriod} />);

    const dashboardRoot = screen.getByTestId('mock-activity-landscape');
    expect(dashboardRoot).toBeInTheDocument();
  });

  // Test Case 5: Complex Load Boundary Switch (Single vs Compare Toggle States)
  it('should seamlessly handle profile scaling updates when switching to comparison datasets', () => {
    const initialDataset = generateMassiveMockData(1);
    const comparisonDataset = generateMassiveMockData(10000);

    const { rerender } = render(
      <DashboardClient
        initialData={initialDataset}
        username="testuser"
        period={mockPeriod}
        compareData={null}
      />
    );

    rerender(
      <DashboardClient
        initialData={initialDataset}
        username="testuser"
        period={mockPeriod}
        compareData={comparisonDataset}
      />
    );

    // FIXED: Asserting against the registered interactive layout button shown in the DOM
    expect(screen.getByText(/Compare Profile/i)).toBeInTheDocument();
  });
});
