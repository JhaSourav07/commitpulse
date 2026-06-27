import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import ContributorsSearch from './ContributorsSearch';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },

  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockContributors = [
  {
    id: 1,
    login: 'sanzzzz-g',
    avatar_url: 'https://github.com/avatar.png',
    contributions: 120,
    html_url: 'https://github.com/sanzzzz-g',
  },
];

describe('ContributorsSearch Theme Contrast Tests', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('renders light mode contrast classes correctly', () => {
    render(<ContributorsSearch contributors={mockContributors} />);

    const input = screen.getByPlaceholderText('Search the collective...');

    expect(input.className).toContain('text-black');

    expect(input.className).toContain('placeholder:text-zinc-400');
  });

  it('renders dark mode contrast classes correctly', () => {
    document.documentElement.classList.add('dark');

    render(<ContributorsSearch contributors={mockContributors} />);

    const input = screen.getByPlaceholderText('Search the collective...');

    expect(input.className).toContain('dark:text-white');

    expect(input.className).toContain('dark:placeholder:text-zinc-500');
  });

  it('applies dark and light border styling on contributor cards', () => {
    render(<ContributorsSearch contributors={mockContributors} />);

    const profileLink = screen.getByRole('link');

    expect(profileLink.className).toContain('border-black/10');

    expect(profileLink.className).toContain('dark:border-white/[0.08]');
  });

  it('shows readable no-results text in dark mode', () => {
    document.documentElement.classList.add('dark');

    render(<ContributorsSearch contributors={mockContributors} />);

    const input = screen.getByPlaceholderText('Search the collective...');

    fireEvent.change(input, {
      target: {
        value: 'unknown-user',
      },
    });

    const emptyHeading = screen.getByText('No architects found');

    expect(emptyHeading.className).toContain('dark:text-white');
  });

  it('preserves foreground visibility against themed backgrounds', () => {
    render(<ContributorsSearch contributors={mockContributors} />);

    const input = screen.getByPlaceholderText('Search the collective...');

    expect(input.className).toContain('bg-transparent');

    const profileText = screen.getByText('View Profile');

    expect(profileText.className).toContain('dark:bg-white/[0.03]');
  });
});
