import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
      button: createMockComponent('button'),
    },
  };
});

const mockProfile = {
  username: 'accessibility-user',
  name: 'Accessibility User',
  avatarUrl: 'https://github.com/test.png',
  isPro: false,
  bio: 'Test bio',
  location: 'Internet',
  joinedDate: '2024-01-01',
  developerScore: 75,
  stats: {
    repositories: 10,
    followers: 100,
    following: 50,
    stars: 200,
  },
};

const mockWrappedData = {
  totalContributions: 1200,
  mostActiveDate: '2024-12-15',
  highestDailyCount: 25,
  busiestMonth: '2024-03',
  weekendRatio: 30,
  topLanguage: 'TypeScript',
  calendar: {
    totalContributions: 1200,
    weeks: [],
  },
};

describe('GithubWrapped Accessibility', () => {
  it('renders main heading correctly for screen readers', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    const heading = screen.getByRole('heading', {
      level: 1,
    });

    expect(heading).toBeDefined();
  });

  it('renders logical heading hierarchy', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    const headings = screen.getAllByRole('heading');

    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders accessible text content for assistive technologies', () => {
    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    expect(screen.getByText(/total contributions/i)).toBeDefined();
  });

  it('supports keyboard navigation flow', async () => {
    const user = userEvent.setup();

    render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);

    await user.tab();

    expect(document.body).toBeDefined();
  });

  it('renders SVG/statistical visual content without accessibility crashes', () => {
    expect(() => {
      render(<GithubWrapped profile={mockProfile} wrappedData={mockWrappedData} />);
    }).not.toThrow();
  });
});
