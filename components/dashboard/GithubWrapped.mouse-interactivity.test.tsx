import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GithubWrapped from './GithubWrapped';
import type { WrappedStats, UserProfile } from '@/types/dashboard';

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

const renderWrapped = () => render(<GithubWrapped profile={profile} wrappedData={wrappedData} />);

describe('GithubWrapped mouse interactivity', () => {
  it('renders interactive wrapped container safely', () => {
    const { container } = renderWrapped();

    const wrappedContainer = container.firstElementChild as HTMLElement;

    expect(wrappedContainer).toBeInTheDocument();
    expect(wrappedContainer.className).toContain('overflow-hidden');
  });

  it('supports mouse enter on stats card areas without crashing', () => {
    renderWrapped();

    const topLanguageCard = screen.getByText('Top Language').closest('div') as HTMLElement;

    fireEvent.mouseEnter(topLanguageCard);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('supports mouse leave on stats card areas without hiding persistent content', () => {
    renderWrapped();

    const weekendCard = screen.getByText('The Weekend Grind').closest('div') as HTMLElement;

    fireEvent.mouseEnter(weekendCard);
    fireEvent.mouseLeave(weekendCard);

    expect(screen.getByText('32%')).toBeInTheDocument();
    expect(screen.getByText(/Take a break/i)).toBeInTheDocument();
  });

  it('supports click propagation on wrapped stat cards without runtime errors', () => {
    renderWrapped();

    const highestDailyCard = screen.getByText('Highest Daily Push').closest('div') as HTMLElement;

    fireEvent.click(highestDailyCard);

    expect(screen.getByText('64 Commits')).toBeInTheDocument();
  });

  it('supports touch gesture events on mobile-like interaction targets', () => {
    renderWrapped();

    const busiestMonthCard = screen.getByText('Busiest Month').closest('div') as HTMLElement;

    fireEvent.touchStart(busiestMonthCard);
    fireEvent.touchEnd(busiestMonthCard);

    expect(screen.getByText('May 2026')).toBeInTheDocument();
  });
});
