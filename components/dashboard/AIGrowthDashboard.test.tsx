/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIGrowthDashboard from './AIGrowthDashboard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      ...props
    }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
    circle: ({ children, ...props }: any) => <circle {...props} data-testid="motion-circle" />,
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Sparkles: (props: any) => <div data-testid="icon-sparkles" {...props} />,
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  TrendingDown: (props: any) => <div data-testid="icon-trending-down" {...props} />,
  Target: (props: any) => <div data-testid="icon-target" {...props} />,
  Award: (props: any) => <div data-testid="icon-award" {...props} />,
  BookOpen: (props: any) => <div data-testid="icon-book-open" {...props} />,
  Terminal: (props: any) => <div data-testid="icon-terminal" {...props} />,
  CheckCircle2: (props: any) => <div data-testid="icon-check-circle" {...props} />,
  Lock: (props: any) => <div data-testid="icon-lock" {...props} />,
  AlertCircle: (props: any) => <div data-testid="icon-alert-circle" {...props} />,
  Wrench: (props: any) => <div data-testid="icon-wrench" {...props} />,
  Info: (props: any) => <div data-testid="icon-info" {...props} />,
  Calendar: (props: any) => <div data-testid="icon-calendar" {...props} />,
  ChevronRight: (props: any) => <div data-testid="icon-chevron-right" {...props} />,
  ExternalLink: (props: any) => <div data-testid="icon-external-link" {...props} />,
}));

describe('AIGrowthDashboard', () => {
  const dummyProfile = {
    username: 'testuser',
    name: 'Test User',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    joinedDate: 'Jan 2020',
    developerScore: 50,
    stats: {
      repositories: 10,
      followers: 20,
      following: 15,
      stars: 50,
    },
  };

  const dummyLanguages = [
    { name: 'TypeScript', color: '#3178c6', percentage: 70 },
    { name: 'JavaScript', color: '#f1e05a', percentage: 30 },
  ];

  const dummyCommitClock = [
    { day: 'Sun', commits: 5 },
    { day: 'Mon', commits: 10 },
    { day: 'Tue', commits: 12 },
    { day: 'Wed', commits: 8 },
    { day: 'Thu', commits: 9 },
    { day: 'Fri', commits: 15 },
    { day: 'Sat', commits: 4 },
  ];

  const activity = Array.from({ length: 60 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const hasCommits = i % 3 === 0;
    return {
      date: dateStr,
      count: hasCommits ? 3 : 0,
      intensity: (hasCommits ? 2 : 0) as 0 | 1 | 2 | 3 | 4,
      locAdditions: hasCommits ? 50 : 0,
      locDeletions: hasCommits ? 10 : 0,
    };
  });

  const dummyData = {
    profile: dummyProfile,
    stats: {
      currentStreak: 5,
      peakStreak: 10,
      totalContributions: 60,
    },
    languages: dummyLanguages,
    activity,
    commitClock: dummyCommitClock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dashboard layout properly', () => {
    render(<AIGrowthDashboard data={dummyData} />);

    // Header renders correctly
    expect(screen.getByText('AI Contributor Growth Insights')).toBeDefined();

    // Verification of section titles
    expect(screen.getByText('Monthly Momentum')).toBeDefined();
    expect(screen.getByText('Consistency Analysis')).toBeDefined();
    expect(screen.getByText('Growth Score Breakdown')).toBeDefined();
    expect(screen.getByText('Developer Profile & Skill Specialization')).toBeDefined();
  });

  it('should toggle between short-term and long-term goal tabs correctly', () => {
    render(<AIGrowthDashboard data={dummyData} />);

    // Default short-term goal renders
    expect(screen.getByText('Maintain a 5-Day Coding Streak')).toBeDefined();

    // Find and click Long-Term button
    const longTermButton = screen.getByRole('button', { name: 'Long-Term' });
    fireEvent.click(longTermButton);

    // Verify long-term goal renders
    expect(screen.getByText('Contribution Century Mark')).toBeDefined();
  });
});
