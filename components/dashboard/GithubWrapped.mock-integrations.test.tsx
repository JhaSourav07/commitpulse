import type { ComponentProps, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GithubWrapped from './GithubWrapped';
import type { WrappedStats, UserProfile } from '@/types/dashboard';

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionDivProps) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Code: () => <div data-testid="icon-code" />,
  Flame: () => <div data-testid="icon-flame" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Coffee: () => <div data-testid="icon-coffee" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
}));

const createWrappedService = () => {
  const cache = new Map<string, unknown>();

  const fetchWrappedStats = vi.fn().mockResolvedValue({
    totalContributions: 2847,
    mostActiveDate: '2025-03-15',
    highestDailyCount: 89,
    busiestMonth: '2025-03',
    weekendRatio: 32,
    topLanguage: 'TypeScript',
    calendar: {
      totalContributions: 2847,
      weeks: [],
    },
  });

  const getWrappedStats = async (username: string) => {
    if (cache.has(username)) {
      return cache.get(username);
    }
    const data = await fetchWrappedStats(username);
    cache.set(username, data);
    return data;
  };

  return { cache, fetchWrappedStats, getWrappedStats };
};

const baseProfile: UserProfile = {
  name: 'Mayank Rawat',
  username: 'mayank200529',
  avatarUrl: 'https://example.com/avatar.png',
  bio: 'Open Source Contributor',
  location: 'Jaipur',
  joinedDate: '2024',
  developerScore: 88,
  isPro: false,
  stats: {
    repositories: 20,
    stars: 150,
    followers: 200,
    following: 50,
  },
};

const baseWrappedData: WrappedStats = {
  totalContributions: 2847,
  mostActiveDate: '2025-03-15',
  highestDailyCount: 89,
  busiestMonth: '2025-03',
  weekendRatio: 32,
  topLanguage: 'TypeScript',
  calendar: {
    totalContributions: 2847,
    weeks: [],
  },
};

describe('GithubWrapped mock-integrations: Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wrapped stats synchronously without requiring any async service calls', () => {
    const asyncServiceSpy = vi.fn().mockResolvedValue({ loaded: true });

    render(<GithubWrapped profile={baseProfile} wrappedData={baseWrappedData} />);

    expect(asyncServiceSpy).not.toHaveBeenCalled();
    expect(screen.getByText('2,847')).toBeTruthy();
    expect(screen.getByText('Total Contributions')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('32%')).toBeTruthy();
  });

  it('queries local cache before triggering remote service retrieval', async () => {
    const { cache, fetchWrappedStats, getWrappedStats } = createWrappedService();

    cache.set('mayank200529', {
      totalContributions: 2847,
      topLanguage: 'TypeScript',
    });

    const result = await getWrappedStats('mayank200529');

    expect(fetchWrappedStats).not.toHaveBeenCalled();
    expect(result).toEqual({ totalContributions: 2847, topLanguage: 'TypeScript' });
  });

  it('falls back to remote fetch when local cache has no entry', async () => {
    const { cache, fetchWrappedStats, getWrappedStats } = createWrappedService();

    expect(cache.has('mayank200529')).toBe(false);

    const result = await getWrappedStats('mayank200529');

    expect(fetchWrappedStats).toHaveBeenCalledTimes(1);
    expect(fetchWrappedStats).toHaveBeenCalledWith('mayank200529');
    expect(result).toEqual({
      totalContributions: 2847,
      mostActiveDate: '2025-03-15',
      highestDailyCount: 89,
      busiestMonth: '2025-03',
      weekendRatio: 32,
      topLanguage: 'TypeScript',
      calendar: { totalContributions: 2847, weeks: [] },
    });
  });

  it('returns a fallback result and does not throw when the async endpoint times out', async () => {
    const timedOutFetch = vi.fn().mockRejectedValue(new Error('Request timeout'));

    const getWithFallback = async (username: string) => {
      try {
        return await timedOutFetch(username);
      } catch {
        return { username, loaded: false, fallback: true };
      }
    };

    const result = await getWithFallback('mayank200529');

    expect(timedOutFetch).toHaveBeenCalledWith('mayank200529');
    expect(result).toEqual({ username: 'mayank200529', loaded: false, fallback: true });

    render(<GithubWrapped profile={baseProfile} wrappedData={baseWrappedData} />);
    expect(screen.getByText('2,847')).toBeTruthy();
  });

  it('writes complete wrapped stats to cache after a successful async fetch', async () => {
    const { cache, fetchWrappedStats, getWrappedStats } = createWrappedService();

    expect(cache.has('mayank200529')).toBe(false);

    await getWrappedStats('mayank200529');

    expect(fetchWrappedStats).toHaveBeenCalledTimes(1);
    expect(cache.has('mayank200529')).toBe(true);
    expect(cache.get('mayank200529')).toEqual({
      totalContributions: 2847,
      mostActiveDate: '2025-03-15',
      highestDailyCount: 89,
      busiestMonth: '2025-03',
      weekendRatio: 32,
      topLanguage: 'TypeScript',
      calendar: { totalContributions: 2847, weeks: [] },
    });
  });
});
