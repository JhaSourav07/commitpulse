import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import GithubWrapped from './GithubWrapped';

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

describe('GithubWrapped Footer', () => {
  it('renders Developer Score label', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/Developer Score:/i)).toBeInTheDocument();
  });

  it('renders the numeric developer score value', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/92\/100/i)).toBeInTheDocument();
  });

  it('renders COMMITPULSE branding text', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('COMMITPULSE')).toBeInTheDocument();
  });
});
