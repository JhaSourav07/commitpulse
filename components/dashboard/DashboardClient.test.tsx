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

  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock framer-motion to avoid animation issues in tests
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
    polygon: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;

      return (
        <polygon className={className} style={style} {...props}>
          {children}
        </polygon>
      );
    },
    path: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;

      return (
        <path className={className} style={style} {...props}>
          {children}
        </path>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock sub-components
vi.mock('./ProfileCard', () => ({
  default: ({ user, badges }: any) => (
    <div data-testid="profile-card">
      <div>{user.name}</div>
      {badges && badges.map((b: any) => <div key={b}>{b}</div>)}
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

vi.mock('./AIInsights', () => ({
  default: () => <div data-testid="ai-insights" />,
}));

vi.mock('./StatsCard', () => ({
  default: ({ title }: any) => <div data-testid={`stats-card-${title}`} />,
}));

vi.mock('./ComparisonStatsCard', () => ({
  default: ({ title }: any) => <div data-testid={`comp-stats-${title}`} />,
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
    { date: '2026-05-03', count: 12, intensity: 3 as const },
  ],
  insights: [{ id: '1', icon: 'zap', text: 'Highly active in mornings' }],
  achievements: [],
  commitClock: [],
  graphData: { nodes: [], links: [] },
};

const mockSecondData = {
  profile: {
    username: 'JhaSourav07',
    name: 'Sourav',
    avatarUrl: 'https://avatars.githubusercontent.com/u/2',
    isPro: true,
    bio: 'Full Stack Developer',
    location: 'India',
    joinedDate: '2019-01-01',
    developerScore: 92,
    stats: {
      repositories: 45,
      followers: 320,
      following: 110,
      stars: 230,
    },
  },
  stats: {
    currentStreak: 12,
    peakStreak: 45,
    totalContributions: 850,
  },
  languages: [
    { name: 'JavaScript', color: '#f1e05a', percentage: 50 },
    { name: 'Go', color: '#00ADD8', percentage: 50 },
  ],
  activity: [
    { date: '2026-05-01', count: 10, intensity: 2 as const },
    { date: '2026-05-02', count: 8, intensity: 1 as const },
    { date: '2026-05-03', count: 15, intensity: 4 as const },
  ],
  insights: [{ id: '1', icon: 'zap', text: 'Hard worker' }],
  achievements: [],
  commitClock: [],
  graphData: { nodes: [], links: [] },
};

const initialDataWithHigherStreak = {
  ...mockInitialData,
  stats: {
    ...mockInitialData.stats,
    peakStreak: 50,
  },
};

const secondDataWithLowerStreak = {
  ...mockSecondData,
  stats: {
    ...mockSecondData.stats,
    peakStreak: 10,
  },
};

describe('DashboardClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard single profile view by default', () => {
    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    expect(screen.getByText('Shivangi')).toBeDefined();
    expect(screen.getByTestId('profile-card')).toBeDefined();
    expect(screen.getByTestId('achievements')).toBeDefined();
    expect(screen.getByTestId('activity-landscape')).toBeDefined();
    expect(screen.getByTestId('language-chart')).toBeDefined();
    expect(screen.getByTestId('heatmap')).toBeDefined();
  });

  it('opens and closes the compare profile modal', async () => {
    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    const compareBtn = screen.getByText('Compare Profile');
    expect(compareBtn).toBeDefined();

    // Open Modal
    fireEvent.click(compareBtn);
    expect(screen.getByPlaceholderText('Enter GitHub Username')).toBeDefined();

    // Close Modal
    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(screen.queryByPlaceholderText('Enter GitHub Username')).toBeNull();
  });

  it('transitions to compare mode when a user is successfully fetched', async () => {
    // Mock successful fetch response
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSecondData),
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    const compareBtn = screen.getByText('Compare Profile');
    fireEvent.click(compareBtn);

    const input = screen.getByPlaceholderText('Enter GitHub Username');
    fireEvent.change(input, { target: { value: 'JhaSourav07' } });

    const submitBtn = screen.getByText('Compare');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Exit Compare Mode')).toBeDefined();
    });

    // Check that we render both User profiles
    expect(screen.getAllByText('Shivangi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sourav').length).toBeGreaterThan(0);
  });

  // =========================================================================
  // ISSUE OBJECTIVE: Add a test for exiting compare mode
  // =========================================================================
  it('exits compare mode and restores single profile view', async () => {
    // Mock successful fetch response to enter compare mode first
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSecondData),
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    // 1. Enter compare mode
    const compareBtn = screen.getByText('Compare Profile');
    fireEvent.click(compareBtn);

    const input = screen.getByPlaceholderText('Enter GitHub Username');
    fireEvent.change(input, { target: { value: 'JhaSourav07' } });

    const submitBtn = screen.getByText('Compare');
    fireEvent.click(submitBtn);

    // Wait for state to update and Exit button to render
    await waitFor(() => {
      expect(screen.getByText('Exit Compare Mode')).toBeDefined();
    });

    // 2. Assert 'Exit Compare Mode' button is visible
    const exitBtn = screen.getByText('Exit Compare Mode');
    expect(exitBtn).toBeDefined();

    // 3. Click it
    fireEvent.click(exitBtn);

    // 4. Assert 'Compare Profile' button is visible again
    expect(screen.getByText('Compare Profile')).toBeDefined();

    // 5. Assert 'Exit Compare Mode' button is gone
    expect(screen.queryByText('Exit Compare Mode')).toBeNull();

    // Verify the second profile is removed from the DOM
    expect(screen.queryByText('Sourav')).toBeNull();
  });

  it('generate your own button points to root /', () => {
    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    const generateLink = screen.getByRole('link', { name: /generate your own/i });
    expect(generateLink.getAttribute('href')).toBe('/');
  });
  // =========================================================================
  // ISSUE OBJECTIVE: Verify error is shown when comparing with same username
  // =========================================================================
  it('shows an error when comparing with the same username (case-insensitive)', async () => {
    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    // 1. Open modal
    const compareBtn = screen.getByText('Compare Profile');
    fireEvent.click(compareBtn);

    // 2. Type the same username as props.username, but all lowercase to test case-insensitivity
    const input = screen.getByPlaceholderText('Enter GitHub Username');
    fireEvent.change(input, { target: { value: 'shivangi1515' } });

    // 3. Click 'Compare'
    const submitBtn = screen.getByText('Compare');
    fireEvent.click(submitBtn);

    // 4. Assert error message 'Cannot compare a profile with itself.' appears
    await waitFor(() => {
      // Using Regex /.../i to match the text even if there is an emoji next to it!
      expect(screen.getByText(/Cannot compare a profile with itself/i)).toBeDefined();
    });
  });

  // =========================================================================
  // ISSUE OBJECTIVE #1063: Verify compare modal input can be cleared
  // =========================================================================
  it('verify compare modal input can be cleared', async () => {
    render(<DashboardClient initialData={mockInitialData} username="Shivangi1515" />);

    // 1. Open modal
    const compareBtn = screen.getByText('Compare Profile');
    fireEvent.click(compareBtn);

    // 2. Type a username into the input
    const input = screen.getByPlaceholderText('Enter GitHub Username');
    fireEvent.change(input, { target: { value: 'testuser' } });

    // 3. Assert 'Clear input' (aria-label) button appears
    const clearButton = screen.getByRole('button', { name: 'Clear input' });
    expect(clearButton).toBeDefined();

    // 4. Click clear button
    fireEvent.click(clearButton);

    // 5. Assert input value is empty
    expect((input as HTMLInputElement).value).toBe('');
  });
});
it('shows Most Consistent badge for profile with higher peak streak in compare mode', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => secondDataWithLowerStreak,
  });

  vi.stubGlobal('fetch', mockFetch);

  render(<DashboardClient initialData={initialDataWithHigherStreak} username="Shivangi1515" />);

  fireEvent.click(screen.getByText('Compare Profile'));

  fireEvent.change(screen.getByPlaceholderText('Enter GitHub Username'), {
    target: { value: 'JhaSourav07' },
  });

  fireEvent.click(screen.getByText('Compare'));

  await waitFor(() => {
    expect(screen.getByText('Exit Compare Mode')).toBeDefined();
  });

  expect(screen.getByText(/Most Consistent/i)).toBeDefined();
});
