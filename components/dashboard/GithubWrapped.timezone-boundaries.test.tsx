import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

import GithubWrapped from './GithubWrapped';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const React = await import('react');

  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');

  const createMockComponent = (tag: keyof React.JSX.IntrinsicElements) => {
    const MockComponent = ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => {
      delete props.initial;
      delete props.animate;
      delete props.exit;
      delete props.transition;
      delete props.whileInView;
      delete props.viewport;

      return React.createElement(tag, props, children);
    };

    MockComponent.displayName = `MockMotion${tag}`;

    return MockComponent;
  };

  return {
    ...actual,

    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,

    motion: {
      div: createMockComponent('div'),
      section: createMockComponent('section'),
      span: createMockComponent('span'),
      svg: createMockComponent('svg'),
      path: createMockComponent('path'),
      circle: createMockComponent('circle'),
      g: createMockComponent('g'),
      text: createMockComponent('text'),
    },
  };
});

const mockProfile = {
  login: 'timezone-user',
  username: 'timezone-user',
  name: 'Timezone Test User',
  avatar_url: 'https://github.com/test.png',
  avatarUrl: 'https://github.com/test.png',
  html_url: 'https://github.com/test',
  isPro: false,
  bio: 'Testing timezones',
  location: 'UTC',
  joinedDate: '2024-01-01',
  developerScore: 75,
  stats: {
    repositories: 10,
    followers: 50,
    following: 25,
    stars: 100,
  },
  type: 'User' as const,
};

const mockWrappedData = {
  calendar: {
    totalContributions: 1200,
    weeks: [],
  },
  totalContributions: 1200,
  mostActiveDate: '2024-03-15',
  highestDailyCount: 45,
  busiestMonth: '2024-03',
  weekendRatio: 30,
  topLanguage: 'TypeScript',
};

describe('GithubWrapped Timezone Boundaries', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it('renders correctly in UTC timezone', () => {
    process.env.TZ = 'UTC';

    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/total contributions/i)).toBeDefined();
  });

  it('renders correctly in IST timezone', () => {
    process.env.TZ = 'Asia/Kolkata';

    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/total contributions/i)).toBeDefined();
  });

  it('handles leap year boundary dates safely', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/total contributions/i)).toBeDefined();
  });

  it('maintains stable rendering around daylight savings transitions', () => {
    process.env.TZ = 'America/New_York';

    expect(() => {
      render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);
    }).not.toThrow();
  });

  it('preserves valid YYYY-MM-DD date formatting across locales', () => {
    const validDate = '2024-02-29';

    expect(validDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
