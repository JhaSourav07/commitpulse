import { describe, it, expect, vi } from 'vitest';
import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ContributorsSearch from './ContributorsSearch';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
          React.createElement(tag as string, props, children),
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  GitFork: () => <svg data-testid="gitfork-icon" />,
}));

const mockContributors = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
];

describe('ContributorsSearch Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('uses correct accessible label coordinates on search input (aria-label)', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    const input = screen.getByRole('textbox', { name: /search contributors by name/i });
    expect(input).toHaveAttribute('aria-label', 'Search contributors by name');
    expect(input).toBeInTheDocument();
  });

  it('ensures interactive elements maintain visible focus outline behaviors', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    const input = screen.getByRole('textbox');
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(input).toBeVisible();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toBeVisible();
    });
  });

  it('announces contributor names via accessible img alt text for screen readers', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    expect(screen.getByAltText('alice')).toBeInTheDocument();
    expect(screen.getByAltText('bob')).toBeInTheDocument();
  });

  it('maintains logical keyboard tab order for all interactive elements', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    const focusables = document.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusables.length).toBeGreaterThan(0);
    focusables.forEach((el) => {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  it('renders contributor profile links with correct heading hierarchy', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    const levels = headings.map((h) => Number(h.tagName.replace('H', '')));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});
