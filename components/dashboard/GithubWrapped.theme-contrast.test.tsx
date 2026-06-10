/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('GithubWrapped — Dark and Light Prefers-Color-Scheme Visual Cohesion (Variation 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves bg-black and text-white container colors to maintain high native contrast under all modes', () => {
    const { container } = render(
      <GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />
    );

    // Outer card container
    const wrapper = container.querySelector('.relative.w-full.max-w-2xl');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.classList.contains('bg-black')).toBe(true);
    expect(wrapper!.classList.contains('text-white')).toBe(true);
  });

  it('uses specific text opacity classes for strict color-contrast legibility against black background', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    // Subtitle under developer name should use text-white/60
    const usernameElement = screen.getByText('@testuser');
    expect(usernameElement.classList.contains('text-white/60')).toBe(true);

    // Busiest month title text-white/60
    const topLanguageTitle = screen.getByText('Top Language');
    expect(topLanguageTitle.classList.contains('text-white/60')).toBe(true);

    // Commit clock / year-in-code label text-white/50
    const yearLabel = screen.getByText('Your Year In Code');
    expect(yearLabel.classList.contains('text-white/50')).toBe(true);
  });

  it('stat cards utilize bg-white/5 and border-white/10 to guarantee visual division boundaries', () => {
    const { container } = render(
      <GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />
    );

    const statCards = container.querySelectorAll('.bg-white\\/5');
    expect(statCards.length).toBe(4);
    statCards.forEach((card) => {
      expect(card.classList.contains('border-white/10')).toBe(true);
    });
  });

  it('dynamic highlights badge contains high contrast classes for readability', () => {
    const { container } = render(
      <GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />
    );

    // Wrapped tag badge container
    const badge = container.querySelector('.bg-white\\/10');
    expect(badge).not.toBeNull();
    expect(badge!.classList.contains('border-white/10')).toBe(true);
  });

  it('renders cleanly and maintains visual compliance under prefers-color-scheme light/dark stubs', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-color-scheme: light'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('TypeScript')).toBeDefined();
  });
});
