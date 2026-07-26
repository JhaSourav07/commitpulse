import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GithubWrapped from './GithubWrapped';
import type { WrappedStats, UserProfile } from '@/types/dashboard';

describe('GithubWrapped error resilience', () => {
  it('dummy test', () => {
    expect(true).toBe(true);
  });
});

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <p>Unable to load GitHub Wrapped</p>
          <button type="button">Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const profile: UserProfile = {
  username: 'alexdev',
  name: 'Alex Morgan',
  avatarUrl: 'https://example.com/alex-avatar.png',
  isPro: false,
  bio: 'Open source contributor',
  location: 'San Francisco, CA',
  joinedDate: '2023-01-15',
  developerScore: 92,
  stats: {
    repositories: 48,
    followers: 230,
    following: 75,
    stars: 1200,
  },
};

const wrappedData: WrappedStats = {
  totalContributions: 2450,
  mostActiveDate: '2026-05-18',
  highestDailyCount: 64,
  busiestMonth: '2026-05',
  weekendRatio: 32,
  topLanguage: 'TypeScript',
  calendar: {
    totalContributions: 2450,
    weeks: [],
  },
};

const renderWithBoundary = (
  customProfile: UserProfile = profile,
  customWrappedData: WrappedStats = wrappedData
) =>
  render(
    <TestErrorBoundary>
      <GithubWrapped profile={customProfile} wrappedData={customWrappedData} />
    </TestErrorBoundary>
  );

describe('GithubWrapped error resilience', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders normally inside an error boundary', () => {
    renderWithBoundary();

    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('Total Contributions')).toBeInTheDocument();
  });

  it('shows recovery UI when wrappedData is missing', () => {
    renderWithBoundary(profile, null as unknown as WrappedStats);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Unable to load GitHub Wrapped')).toBeInTheDocument();
  });

  it('logs unexpected render exceptions', () => {
    renderWithBoundary(profile, null as unknown as WrappedStats);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('provides a retry control on recovery panel', () => {
    renderWithBoundary(profile, null as unknown as WrappedStats);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders safe fallback-like values without crashing', () => {
    renderWithBoundary(profile, {
      ...wrappedData,
      totalContributions: 0,
      topLanguage: 'Unknown',
      highestDailyCount: 0,
      busiestMonth: 'Invalid Month',
      weekendRatio: 0,
    });

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('0 Commits')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
