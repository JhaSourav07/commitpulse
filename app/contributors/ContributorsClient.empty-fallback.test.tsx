import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ContributorsClient from './ContributorsClient';

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
};

const mockContributors: Contributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
];

const scrollTriggers = vi.hoisted(() => [{ kill: vi.fn() }]);

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => scrollTriggers,
  },
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    width?: number;
    height?: number;
  }) => React.createElement('img', { alt, src, ...props }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeAll(() => {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

describe('ContributorsClient - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely with empty contributors array', () => {
    render(
      <ContributorsClient
        contributors={[]}
        totalContributions={10}
        topContributors={mockContributors}
      />
    );

    expect(screen.getByRole('link', { name: /View Repository/i })).toBeInTheDocument();
  });

  it('renders safely with empty top contributors array', () => {
    render(
      <ContributorsClient
        contributors={mockContributors}
        totalContributions={10}
        topContributors={[]}
      />
    );

    expect(screen.getByRole('link', { name: /Explore The Elite/i })).toBeInTheDocument();
  });

  it('renders correctly when total contributions is zero', () => {
    render(<ContributorsClient contributors={[]} totalContributions={0} topContributors={[]} />);

    expect(screen.getByRole('link', { name: /View Repository/i })).toBeInTheDocument();
  });

  it('does not emit console errors when rendered with empty data', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ContributorsClient contributors={[]} totalContributions={0} topContributors={[]} />);

    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('preserves core navigation actions with all datasets empty', () => {
    render(<ContributorsClient contributors={[]} totalContributions={0} topContributors={[]} />);

    expect(screen.getByRole('link', { name: /View Repository/i })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Explore The Elite/i })).toBeInTheDocument();
  });
});
