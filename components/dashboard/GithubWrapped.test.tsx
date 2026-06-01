import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

import GithubWrapped from './GithubWrapped';
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
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
  totalContributions: 1200,
  topLanguage: 'TypeScript',
  highestDailyCount: 25,
  mostActiveDate: '2026-05-20',
  busiestMonth: '2026-04',
  weekendRatio: 30,
};

describe('GithubWrapped', () => {
  it('renders user name', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders total contributions', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('renders top language', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders highest daily count', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('25 Commits')).toBeInTheDocument();
  });

  it('renders busiest month formatted correctly', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('renders weekend ratio percentage', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('renders Take a break when weekend ratio is greater than 25', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/Take a break!/i)).toBeInTheDocument();
  });

  it('renders Good work/life balance when weekend ratio is 25 or less', () => {
    const balancedData = {
      ...mockWrappedData,
      weekendRatio: 20,
    };

    render(<GithubWrapped profile={mockProfile} wrappedData={balancedData} />);

    expect(screen.getByText(/Good work\/life balance!/i)).toBeInTheDocument();
  });
});
