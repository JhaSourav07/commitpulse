import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContributorsClient from './ContributorsClient';

const mockContributors = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
];

vi.mock('./ContributorsSearch', () => ({
  default: () => <div>Contributors Search</div>,
}));

vi.mock('@/components/Leaderboard', () => ({
  default: () => <div>Leaderboard</div>,
}));

vi.mock('@/app/components/Footer', () => ({
  Footer: () => <div>Footer</div>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
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

    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: <T,>(v: T) => v,
  useTransform: () => 0,
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

const renderClient = () =>
  render(
    <ContributorsClient
      contributors={mockContributors}
      totalContributions={42}
      topContributors={mockContributors}
    />
  );

describe('ContributorsClient Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('renders accessible heading content for screen readers', () => {
    renderClient();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('exposes semantic heading hierarchy', () => {
    renderClient();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /the vanguard/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /the collective/i })).toBeInTheDocument();
  });

  it('does not expose unnecessary aria-label attributes', () => {
    renderClient();

    document.querySelectorAll('[aria-label]').forEach((element) => {
      expect(element).toBeFalsy();
    });
  });

  it('does not expose unnecessary aria-labelledby attributes', () => {
    renderClient();

    document.querySelectorAll('[aria-labelledby]').forEach((element) => {
      expect(element).toBeFalsy();
    });
  });

  it('does not expose unnecessary aria-describedby attributes', () => {
    renderClient();

    document.querySelectorAll('[aria-describedby]').forEach((element) => {
      expect(element).toBeFalsy();
    });
  });
});
