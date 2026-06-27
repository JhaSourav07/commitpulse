/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardClient from './DashboardClient';

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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const clean = { ...props };
      delete clean.initial;
      delete clean.animate;
      delete clean.whileInView;
      delete clean.viewport;
      delete clean.transition;
      delete clean.whileHover;
      delete clean.exit;
      delete clean.onAnimationComplete;
      return (
        <div className={className} {...clean}>
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
  default: () => <div data-testid="achievements" />,
}));

vi.mock('./ActivityLandscape', () => ({
  default: () => <div data-testid="activity-landscape" />,
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
  default: () => <div data-testid="historical-trend-view" />,
}));

vi.mock('./AIInsights', () => ({
  default: () => <div data-testid="ai-insights" />,
}));

vi.mock('./StatsCard', () => ({
  default: ({ title }: any) => <div data-testid={`stats-card-${title}`} />,
}));

vi.mock('./RepositoryGraph', () => ({
  default: () => <div data-testid="repository-graph" />,
}));

vi.mock('./PopularPinnnedRepos', () => ({
  PopularRepos: () => <div data-testid="popular-repos" />,
}));

vi.mock('./ResumeProfileSection', () => ({
  default: () => <div data-testid="resume-profile-section" />,
}));

vi.mock('./ProfileOptimizerModal', () => ({
  default: () => <div data-testid="profile-optimizer-modal" />,
}));

const mockInitialData = {
  profile: {
    username: 'Shivangi1515',
    name: 'Shivangi',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    isPro: false,
    bio: 'Software Dev',
    location: 'India',
    joinedDate: '2020-01-01',
    developerScore: 85,
    stats: { repositories: 30, followers: 120, following: 80, stars: 45 },
  },
  stats: { currentStreak: 5, peakStreak: 35, totalContributions: 600 },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percentage: 60 },
    { name: 'Python', color: '#3572A5', percentage: 40 },
  ],
  activity: [
    { date: '2026-05-01', count: 5, intensity: 1 as const },
    { date: '2026-05-02', count: 0, intensity: 0 as const },
  ],
  insights: [{ id: '1', icon: 'zap', text: 'Highly active in mornings' }],
  achievements: [],
  commitClock: [],
  graphData: { nodes: [], links: [] },
  popularRepos: [],
  pinnedRepos: [],
};

const mockPeriod = {
  kind: 'year' as const,
  label: '2026',
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-12-31T23:59:59.999Z',
  year: '2026',
};

function renderDashboard() {
  return render(
    <DashboardClient initialData={mockInitialData} username="Shivangi1515" period={mockPeriod} />
  );
}

describe('DashboardClient - Accessibility & Aria compliance (Variation 4)', () => {
  it('Case 1: Inspect markup to verify correct accessible label coordinates on landmarks and interactive elements', () => {
    renderDashboard();

    const root = document.querySelector('[data-dashboard]');
    expect(root).toBeInTheDocument();

    const compareBtn = screen.getByRole('button', { name: /compare profile/i });
    expect(compareBtn).toBeInTheDocument();
    expect(compareBtn.tagName.toLowerCase()).toBe('button');

    const generateLink = screen.getByRole('link', { name: /generate your own/i });
    expect(generateLink).toBeInTheDocument();

    fireEvent.click(compareBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'compare-modal-title');

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter GitHub Username');

    const submitBtn = screen.getByRole('button', { name: /compare$/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it('Case 2: Assert focusable interactive nodes maintain visible focus capability', () => {
    renderDashboard();

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      btn.focus();
      expect(document.activeElement).toBe(btn);
    });

    const link = screen.getByRole('link', { name: /generate your own/i });
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('Case 3: Verify tooltip labels are announced with correct accessibility descriptions', () => {
    renderDashboard();

    const closeBtn = screen.queryByLabelText('Close modal');
    expect(closeBtn).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /compare profile/i }));

    const modalCloseBtn = screen.getByLabelText('Close modal');
    expect(modalCloseBtn).toBeInTheDocument();
    expect(modalCloseBtn.tagName.toLowerCase()).toBe('button');

    const input = screen.getByPlaceholderText('Enter GitHub Username');
    fireEvent.change(input, { target: { value: 'testuser' } });

    const clearBtn = screen.getByLabelText('Clear input');
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn.tagName.toLowerCase()).toBe('button');
  });

  it('Case 4: Test keyboard control path selectors to ensure normal tab ordering', () => {
    renderDashboard();

    const focusable = Array.from(
      document.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"]), a[href]')
    ) as HTMLElement[];

    expect(focusable.length).toBeGreaterThan(0);

    const profileOptimizerBtn = screen.getByRole('button', { name: /profile optimizer/i });
    const compareBtn = screen.getByRole('button', { name: /compare profile/i });
    const refreshBtn = screen.getByTestId('refresh-button');
    const shareBtn = screen.getByRole('button', { name: /^share$/i });
    const generateLink = screen.getByRole('link', { name: /generate your own/i });

    const optIndex = focusable.indexOf(profileOptimizerBtn);
    const compIndex = focusable.indexOf(compareBtn);
    const refIndex = focusable.indexOf(refreshBtn);
    const shareIndex = focusable.indexOf(shareBtn);
    const genIndex = focusable.indexOf(generateLink);

    expect(optIndex).toBeGreaterThanOrEqual(0);
    expect(compIndex).toBeGreaterThanOrEqual(0);
    expect(refIndex).toBeGreaterThanOrEqual(0);
    expect(shareIndex).toBeGreaterThanOrEqual(0);
    expect(genIndex).toBeGreaterThanOrEqual(0);

    expect(optIndex).toBeLessThan(compIndex);
    expect(compIndex).toBeLessThan(refIndex);
    expect(refIndex).toBeLessThan(shareIndex);
    expect(shareIndex).toBeLessThan(genIndex);
  });

  it('Case 5: Confirm standard headings exist in correct logical hierarchical order', () => {
    const { container } = renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /compare profile/i }));

    const headings = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    ) as HTMLElement[];
    expect(headings.length).toBeGreaterThan(0);

    const levels = headings.map((h) => parseInt(h.tagName.substring(1), 10));

    for (let i = 0; i < levels.length - 1; i++) {
      const jump = levels[i + 1] - levels[i];
      expect(jump).toBeLessThanOrEqual(1);
    }
  });
});
