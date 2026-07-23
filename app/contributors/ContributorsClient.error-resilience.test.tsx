import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import ContributorsClient from './ContributorsClient';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    }
  >) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => [],
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),

    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),

    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 {...props}>{children}</h1>
    ),

    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 {...props}>{children}</h2>
    ),

    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
  },

  useMotionValue: () => ({
    get: () => 0,
    set: vi.fn(),
  }),

  useSpring: <T,>(value: T) => value,

  useTransform: () => 0,
}));

interface MockContributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

vi.mock('./ContributorsSearch', () => ({
  default: ({ contributors }: { contributors: MockContributor[] }) => (
    <div data-testid="contributors-search">Contributors: {contributors.length}</div>
  ),
}));

vi.mock('@/components/Leaderboard', () => ({
  default: ({ contributors }: { contributors: MockContributor[] }) => (
    <div data-testid="leaderboard">Leaderboard: {contributors.length}</div>
  ),
}));

vi.mock('@/app/components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

const contributors: MockContributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/avatar.png',
    contributions: 25,
    html_url: 'https://github.com/alice',
  },
];

describe('ContributorsClient error resilience', () => {
  it('renders successfully with valid data', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={25}
        topContributors={contributors}
      />
    );

    expect(screen.getByText(/BUILDING/i)).toBeInTheDocument();
  });

  it('renders safely with empty contributors', () => {
    render(<ContributorsClient contributors={[]} totalContributions={0} topContributors={[]} />);

    expect(screen.getByText(/THE COLLECTIVE/i)).toBeInTheDocument();
  });

  it('renders leaderboard component', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={25}
        topContributors={contributors}
      />
    );

    expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
  });

  it('renders contributors search component', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={25}
        topContributors={contributors}
      />
    );

    expect(screen.getByTestId('contributors-search')).toBeInTheDocument();
  });

  it('renders footer without crashing', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={25}
        topContributors={contributors}
      />
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
