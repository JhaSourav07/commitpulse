/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfileComparisonAnalytics, { CompareUser } from './ProfileComparisonAnalytics';

// Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options && options.count !== undefined) {
        return key; // Simple mock returning key
      }
      return key;
    },
  }),
}));

// Mock framer-motion to render clean HTML containers for testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      const { initial, animate, whileInView, viewport, transition, ...rest } = props;
      return (
        <div className={className} style={style} {...rest}>
          {children}
        </div>
      );
    },
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Award: () => <span data-testid="icon-award" />,
  Trophy: () => <span data-testid="icon-trophy" />,
  Flame: () => <span data-testid="icon-flame" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Star: () => <span data-testid="icon-star" />,
  GitFork: () => <span data-testid="icon-gitfork" />,
  GitCommit: () => <span data-testid="icon-gitcommit" />,
  MapPin: () => <span data-testid="icon-mappin" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Check: () => <span data-testid="icon-check" />,
  Lock: () => <span data-testid="icon-lock" />,
  ExternalLink: () => <span data-testid="icon-externallink" />,
  ChevronDown: () => <span data-testid="icon-chevrondown" />,
  ChevronUp: () => <span data-testid="icon-chevronup" />,
}));

const mockUser1: CompareUser = {
  profile: {
    username: 'alice',
    name: 'Alice Cooper',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    isPro: true,
    bio: 'Frontend enthusiast',
    location: 'New York',
    joinedDate: 'Joined Oct 2020',
    developerScore: 85,
    stats: { repositories: 12, followers: 150, following: 80, stars: 300 },
  },
  stats: {
    currentStreak: 5,
    peakStreak: 15,
    totalContributions: 500,
  },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percentage: 70 },
    { name: 'JavaScript', color: '#f1e05a', percentage: 30 },
  ],
  activity: [
    { date: '2026-05-10', count: 5, intensity: 2 },
    { date: '2026-05-11', count: 10, intensity: 3 },
    { date: '2026-06-01', count: 2, intensity: 1 },
  ],
  achievements: [
    {
      id: 'streak-10',
      title: '10 Day Streak',
      description: 'Coded for 10 days',
      icon: 'flame',
      isUnlocked: true,
      type: 'streak',
      threshold: 10,
      currentValue: 10,
      progress: 100,
    },
    {
      id: 'contrib-100',
      title: 'Centurion',
      description: '100 contributions',
      icon: 'trophy',
      isUnlocked: true,
      type: 'contributions',
      threshold: 100,
      currentValue: 100,
      progress: 100,
    },
    {
      id: 'ach-3',
      title: 'Achievement 3',
      description: 'Description 3',
      icon: 'star',
      isUnlocked: true,
      type: 'streak',
      threshold: 5,
      currentValue: 5,
      progress: 100,
    },
    {
      id: 'ach-4',
      title: 'Achievement 4',
      description: 'Description 4',
      icon: 'star',
      isUnlocked: true,
      type: 'streak',
      threshold: 5,
      currentValue: 5,
      progress: 100,
    },
    {
      id: 'ach-5',
      title: 'Achievement 5',
      description: 'Description 5',
      icon: 'star',
      isUnlocked: true,
      type: 'streak',
      threshold: 5,
      currentValue: 5,
      progress: 100,
    },
  ],
  popularRepos: [
    {
      name: 'alice-cool-web',
      description: 'Alice web project',
      stargazerCount: 50,
      forkCount: 10,
      url: 'https://github.com/alice/alice-cool-web',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      commits: 20,
    } as any,
    {
      name: 'alice-utils',
      description: 'Alice util project',
      stargazerCount: 10,
      forkCount: 2,
      url: 'https://github.com/alice/alice-utils',
      primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
      commits: 5,
    } as any,
  ],
};

const mockUser2: CompareUser = {
  profile: {
    username: 'bob',
    name: 'Bob Builder',
    avatarUrl: 'https://avatars.githubusercontent.com/u/2',
    isPro: false,
    bio: 'Backend architect',
    location: 'Berlin',
    joinedDate: 'Joined Jan 2021',
    developerScore: 90,
    stats: { repositories: 8, followers: 90, following: 40, stars: 120 },
  },
  stats: {
    currentStreak: 2,
    peakStreak: 8,
    totalContributions: 320,
  },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percentage: 40 },
    { name: 'Go', color: '#00add8', percentage: 60 },
  ],
  activity: [
    { date: '2026-05-10', count: 3, intensity: 1 },
    { date: '2026-06-01', count: 8, intensity: 3 },
  ],
  achievements: [
    {
      id: 'streak-10',
      title: '10 Day Streak',
      description: 'Coded for 10 days',
      icon: 'flame',
      isUnlocked: false,
      type: 'streak',
      threshold: 10,
      currentValue: 4,
      progress: 40,
    },
    {
      id: 'contrib-100',
      title: 'Centurion',
      description: '100 contributions',
      icon: 'trophy',
      isUnlocked: true,
      type: 'contributions',
      threshold: 100,
      currentValue: 100,
      progress: 100,
    },
  ],
  popularRepos: [
    {
      name: 'bob-go-engine',
      description: 'Bob high performance engine',
      stargazerCount: 100,
      forkCount: 30,
      url: 'https://github.com/bob/bob-go-engine',
      primaryLanguage: { name: 'Go', color: '#00add8' },
      commits: 40,
    } as any,
    {
      name: 'bob-script',
      description: 'Bob basic script',
      stargazerCount: 5,
      forkCount: 0,
      url: 'https://github.com/bob/bob-script',
      primaryLanguage: { name: 'Go', color: '#00add8' },
      commits: 2,
    } as any,
  ],
};

describe('ProfileComparisonAnalytics', () => {
  it('renders usernames, developer scores, and key stats in side-by-side layout', () => {
    render(<ProfileComparisonAnalytics user1={mockUser1} user2={mockUser2} />);

    // Check profiles
    expect(screen.getByText('Alice Cooper')).toBeDefined();
    expect(screen.getAllByText('@alice')[0]).toBeDefined();
    expect(screen.getByText('Bob Builder')).toBeDefined();
    expect(screen.getAllByText('@bob')[0]).toBeDefined();

    // Check developer score display
    expect(screen.getByText('dashboard.compare.developer_score: 85')).toBeDefined();
    expect(screen.getByText('dashboard.compare.developer_score: 90')).toBeDefined();

    // Check total contributions
    expect(
      screen.getAllByText('dashboard.compare.contribution_comparison.user_total')[0]
    ).toBeDefined();
  });

  it('correctly ranks repositories and calculates impact scores', () => {
    render(<ProfileComparisonAnalytics user1={mockUser1} user2={mockUser2} />);

    // Scores check:
    // bob-go-engine: 40 commits * 3 + 100 stars * 5 + 30 forks * 10 = 920
    // alice-cool-web: 20 commits * 3 + 50 stars * 5 + 10 forks * 10 = 410
    // alice-utils: 5 commits * 3 + 10 stars * 5 + 2 forks * 10 = 85
    // bob-script: 2 commits * 3 + 5 stars * 5 + 0 forks * 10 = 31

    // Renders repository names
    expect(screen.getByText('bob-go-engine')).toBeDefined();
    expect(screen.getByText('alice-cool-web')).toBeDefined();
    expect(screen.getByText('alice-utils')).toBeDefined();
    expect(screen.getByText('bob-script')).toBeDefined();

    // Check impact score renders
    expect(screen.getByText('920')).toBeDefined();
    expect(screen.getByText('410')).toBeDefined();
    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText('31')).toBeDefined();
  });

  it('displays language side-by-side percentage comparisons correctly', () => {
    render(<ProfileComparisonAnalytics user1={mockUser1} user2={mockUser2} />);

    // Languages: TS (Alice 70%, Bob 40%), JS (Alice 30%, Bob 0%), Go (Alice 0%, Bob 60%)
    expect(screen.getByText('70.0%')).toBeDefined();
    expect(screen.getByText('40.0%')).toBeDefined();
    expect(screen.getByText('30.0%')).toBeDefined();
    expect(screen.getByText('60.0%')).toBeDefined();
  });

  it('renders achievements status with unlock/lock badges correctly', () => {
    render(<ProfileComparisonAnalytics user1={mockUser1} user2={mockUser2} />);

    // We have "10 Day Streak" which is unlocked for Alice but locked for Bob
    expect(screen.getByText('10 Day Streak')).toBeDefined();

    // Alice unlocked badge, Bob locked badge
    const aliceUnlockedBadges = screen.getAllByRole('img', {
      name: 'alice unlocked 10 Day Streak',
    });
    const bobLockedBadges = screen.getAllByRole('img', { name: 'bob locked 10 Day Streak' });

    expect(aliceUnlockedBadges.length).toBe(1);
    expect(bobLockedBadges.length).toBe(1);
  });

  it('handles zero-activity and empty-state edge cases gracefully', () => {
    const emptyUser1: CompareUser = {
      profile: {
        username: 'empty1',
        name: 'Empty One',
        avatarUrl: '',
        isPro: false,
        bio: '',
        location: '',
        joinedDate: '',
        developerScore: 0,
        stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
      },
      stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
      languages: [],
      activity: [],
      achievements: [],
      popularRepos: [],
    };

    const emptyUser2: CompareUser = {
      profile: {
        username: 'empty2',
        name: 'Empty Two',
        avatarUrl: '',
        isPro: false,
        bio: '',
        location: '',
        joinedDate: '',
        developerScore: 0,
        stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
      },
      stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
      languages: [],
      activity: [],
      achievements: [],
      popularRepos: [],
    };

    render(<ProfileComparisonAnalytics user1={emptyUser1} user2={emptyUser2} />);

    // Verify empty state fallback messages are rendered
    expect(screen.getByText('dashboard.compare.contribution_comparison.no_data')).toBeDefined();
    expect(screen.getByText('dashboard.compare.language_comparison.no_data')).toBeDefined();
    expect(screen.getByText('dashboard.compare.achievement_comparison.no_data')).toBeDefined();
    expect(screen.getByText('dashboard.compare.repository_comparison.no_data')).toBeDefined();
  });

  it('supports keyboard accessibility controls and ARIA compliance', () => {
    const { container } = render(
      <ProfileComparisonAnalytics user1={mockUser1} user2={mockUser2} />
    );

    // Region has comparison aria label
    const region = screen.getByRole('region', { name: 'dashboard.compare.title' });
    expect(region).toBeDefined();

    // Verify that links have accessible labels
    const repoLinks = screen.getAllByRole('link');
    expect(repoLinks.length).toBeGreaterThanOrEqual(2);
    expect(repoLinks[0].getAttribute('aria-label')).toContain('repository on GitHub');

    // Achievement show more/less toggle button is keyboard-focusable
    const toggleButton = screen.getByRole('button', { name: /dashboard.achievements.see_all/i });
    expect(toggleButton).toBeDefined();
    expect(toggleButton.tabIndex).toBe(0);

    // Click toggle button and check if it switches to 'show_less'
    fireEvent.click(toggleButton);
    expect(screen.getByText('dashboard.achievements.show_less')).toBeDefined();
  });
});
