/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GithubWrapped from './GithubWrapped';
import type { WrappedStats, UserProfile } from '../../types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.variants;
      return (
        <div className={className} style={style}>
          {children}
        </div>
      );
    },
  },
}));

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
};

describe('GithubWrapped — Massive Data Sets and Extreme High Bounds Scaling (Variation 2)', () => {
  it('formats extremely high contribution counts cleanly with localized separators', () => {
    const hugeData = {
      ...mockWrappedData,
      totalContributions: 999999999,
    };

    render(<GithubWrapped profile={mockProfile} wrappedData={hugeData} />);

    // Total contributions should be formatted with localized comma separators
    expect(screen.getByText((999999999).toLocaleString())).toBeDefined();
  });

  it('safely renders developer scores at extreme boundaries (0 and 100) without crashing', () => {
    // Test minimum score bound
    const profileMin = { ...mockProfile, developerScore: 0 };
    const { rerender } = render(
      <GithubWrapped profile={profileMin} wrappedData={mockWrappedData} />
    );
    expect(screen.getByText(/Developer Score: 0\/100/i)).toBeDefined();

    // Test maximum score bound
    const profileMax = { ...mockProfile, developerScore: 100 };
    rerender(<GithubWrapped profile={profileMax} wrappedData={mockWrappedData} />);
    expect(screen.getByText(/Developer Score: 100\/100/i)).toBeDefined();
  });

  it('handles extremely long usernames and display names safely without layout crashes', () => {
    const longProfile = {
      ...mockProfile,
      name: 'A'.repeat(200),
      username: 'B'.repeat(100),
    };

    render(<GithubWrapped profile={longProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('A'.repeat(200))).toBeDefined();
    expect(screen.getByText(`@${'B'.repeat(100)}`)).toBeDefined();
  });

  it('scales correctly under massive single-day commit spikes', () => {
    const massiveSpikeData = {
      ...mockWrappedData,
      highestDailyCount: 1000000,
    };

    render(<GithubWrapped profile={mockProfile} wrappedData={massiveSpikeData} />);

    expect(screen.getByText('1000000 Commits')).toBeDefined();
  });

  it('verifies visual output and text responses under extreme weekend ratio boundaries (0% and 100%)', () => {
    // 0% ratio: work/life balance active
    const zeroRatio = { ...mockWrappedData, weekendRatio: 0 };
    const { rerender } = render(<GithubWrapped profile={mockProfile} wrappedData={zeroRatio} />);
    expect(screen.getByText('0%')).toBeDefined();
    expect(screen.getByText(/Good work\/life balance!/i)).toBeDefined();

    // 100% ratio: take a break active
    const hundredRatio = { ...mockWrappedData, weekendRatio: 100 };
    rerender(<GithubWrapped profile={mockProfile} wrappedData={hundredRatio} />);
    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText(/Take a break!/i)).toBeDefined();
  });
});
