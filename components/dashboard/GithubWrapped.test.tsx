import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

import GithubWrapped from './GithubWrapped';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

const mockExportImage = vi.fn();
vi.mock('@/hooks/useExportImage', () => ({
  useExportImage: () => ({
    exportImage: mockExportImage,
    isExporting: false,
    error: null,
  }),
}));

import type { WrappedStats, UserProfile } from '@/types/dashboard';

const mockProfile: UserProfile = {
  name: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.png',
  developerScore: 92,

  isPro: false,
  bio: 'Test bio',
  location: 'Internet',
  joinedDate: '2026-01-01',

  stats: {
    repositories: 10,
    followers: 100,
    following: 50,
    stars: 200,
  },
};

const mockWrappedData: WrappedStats = {
  calendar: { totalContributions: 1200, weeks: [] },
  totalContributions: 1200,
  topLanguage: 'TypeScript',
  highestDailyCount: 25,
  mostActiveDate: '2026-05-20',
  busiestMonth: '2026-04',
  weekendRatio: 30,
  contributionGrowth: 15,
  longestStreak: 12,
  mostProductiveDay: 'Wednesday',
  mostActiveHour: 14,
  primaryLanguages: [
    { name: 'TypeScript', percentage: 70, color: '#3178c6' },
    { name: 'JavaScript', percentage: 30, color: '#f1e05a' },
  ],
  mostActiveRepos: [
    { name: 'repo-1', commits: 50 },
    { name: 'repo-2', commits: 30 },
  ],
  milestones: [
    {
      name: 'First 100 Contributions',
      description: 'Crossed 100 contributions in a single year.',
      unlocked: true,
    },
    {
      name: 'Consistent Coder',
      description: 'Achieved a contribution streak of 7+ days.',
      unlocked: true,
    },
  ],
};

describe('GithubWrapped', () => {
  it('renders user name', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText('Test User')[0]).toBeInTheDocument();
  });

  it('renders total contributions', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText('1,200')[0]).toBeInTheDocument();
  });

  it('renders top language', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText('TypeScript')[0]).toBeInTheDocument();
  });

  it('renders highest daily count', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText('25 Commits')[0]).toBeInTheDocument();
  });

  it('renders busiest month formatted correctly', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText('April 2026')[0]).toBeInTheDocument();
  });

  it('renders weekend ratio percentage', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText('30%')[0]).toBeInTheDocument();
  });

  it('renders Take a break when weekend ratio is greater than 25', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getAllByText(/Take a break!/i)[0]).toBeInTheDocument();
  });

  it('renders Good work/life balance when weekend ratio is 25 or less', () => {
    const balancedData = {
      ...mockWrappedData,
      weekendRatio: 20,
    };

    render(<GithubWrapped profile={mockProfile} wrappedData={balancedData} />);

    expect(screen.getAllByText(/Good work\/life balance!/i)[0]).toBeInTheDocument();
  });

  it('can navigate through all slides using buttons', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    // Initially we are on Slide 1 of 6
    expect(screen.getByText('Slide 1 of 6')).toBeInTheDocument();
    expect(screen.getByText('Your Annual Journey')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0];
    const nextButton = buttons[1];

    expect(prevButton).toBeDisabled();

    // Go to slide 2
    fireEvent.click(nextButton);
    expect(screen.getByText('Slide 2 of 6')).toBeInTheDocument();
    expect(screen.getAllByText('Total Contributions')[0]).toBeInTheDocument();

    // Go to slide 3
    fireEvent.click(nextButton);
    expect(screen.getByText('Slide 3 of 6')).toBeInTheDocument();
    expect(screen.getByText('Tech Stack & Activity')).toBeInTheDocument();
    expect(screen.getByText('repo-1')).toBeInTheDocument();

    // Go to slide 4
    fireEvent.click(nextButton);
    expect(screen.getByText('Slide 4 of 6')).toBeInTheDocument();
    expect(screen.getByText('Work Style & Tempo')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();

    // Go to slide 5
    fireEvent.click(nextButton);
    expect(screen.getByText('Slide 5 of 6')).toBeInTheDocument();
    expect(screen.getByText('Personal Milestones')).toBeInTheDocument();

    // Go to slide 6
    fireEvent.click(nextButton);
    expect(screen.getByText('Slide 6 of 6')).toBeInTheDocument();
    expect(screen.getByText('Choose Card Theme')).toBeInTheDocument();

    // Click theme button
    const neonThemeButton = screen.getByText('Neon');
    fireEvent.click(neonThemeButton);

    // Click download button
    const downloadButton = screen.getByText('Download PNG');
    fireEvent.click(downloadButton);
    expect(mockExportImage).toHaveBeenCalledWith('png');

    // Click Replay button to go back to slide 1
    const replayButton = screen.getByText('Replay');
    fireEvent.click(replayButton);
    expect(screen.getByText('Slide 1 of 6')).toBeInTheDocument();
  });
});
