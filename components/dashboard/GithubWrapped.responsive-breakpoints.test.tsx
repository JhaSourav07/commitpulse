import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event('resize'));
};

const renderWrapped = () => render(<GithubWrapped profile={profile} wrappedData={wrappedData} />);

describe('GithubWrapped responsive breakpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders safely on mobile viewport width', () => {
    setViewport(375, 812);

    const { container } = renderWrapped();

    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain('w-full');
    expect(wrapper.className).toContain('max-w-2xl');
  });

  it('uses responsive single-column to two-column grid classes', () => {
    setViewport(375, 812);

    const { container } = renderWrapped();

    const grid = container.querySelector('.grid') as HTMLElement;

    expect(grid).toBeInTheDocument();
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
  });

  it('uses responsive padding classes for mobile and desktop spacing', () => {
    setViewport(390, 844);

    const { container } = renderWrapped();

    const content = container.querySelector('.relative.z-10') as HTMLElement;

    expect(content).toBeInTheDocument();
    expect(content.className).toContain('p-8');
    expect(content.className).toContain('md:p-12');
  });

  it('keeps key content available on narrow screens without clipping', () => {
    setViewport(320, 568);

    renderWrapped();

    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('@alexdev')).toBeInTheDocument();
    expect(screen.getByText('Total Contributions')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('scales wrapped layout content across desktop viewport', () => {
    setViewport(1440, 900);

    const { container } = renderWrapped();

    const wrapper = container.firstElementChild as HTMLElement;
    const grid = container.querySelector('.grid') as HTMLElement;

    expect(wrapper.className).toContain('max-w-2xl');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(screen.getByText('Developer Score: 92/100')).toBeInTheDocument();
  });
});
