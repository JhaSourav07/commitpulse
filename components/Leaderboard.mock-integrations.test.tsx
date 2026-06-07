import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';

vi.mock('next/image', () => ({
  default: ({ alt = '', fill, ...props }: ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileInView,
      initial,
      viewport,
      transition,
      animate,
      ...props
    }: ComponentProps<'div'> & {
      children?: ReactNode;
      whileHover?: unknown;
      whileInView?: unknown;
      initial?: unknown;
      viewport?: unknown;
      transition?: unknown;
      animate?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

const contributors: Contributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: '/alice.png',
    contributions: 120,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: '/bob.png',
    contributions: 90,
    html_url: 'https://github.com/bob',
  },
  {
    id: 3,
    login: 'carol',
    avatar_url: '/carol.png',
    contributions: 70,
    html_url: 'https://github.com/carol',
  },
  {
    id: 4,
    login: 'dave',
    avatar_url: '/dave.png',
    contributions: 40,
    html_url: 'https://github.com/dave',
  },
];

describe('Leaderboard mock integrations', () => {
  it('renders contributor data from mocked local input without network calls', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    render(<Leaderboard contributors={contributors} />);

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('carol')).toBeTruthy();
    expect(screen.getByText('dave')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('renders cached contributor-like data before requiring remote retrieval', () => {
    const cachedContributors = contributors.slice(0, 3);

    render(<Leaderboard contributors={cachedContributors} />);

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('carol')).toBeTruthy();
  });

  it('does not query localStorage during isolated render flow', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    render(<Leaderboard contributors={contributors} />);

    expect(getItemSpy).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
  });

  it('stays stable when mocked endpoint timeout returns no contributors', () => {
    expect(() => render(<Leaderboard contributors={[]} />)).not.toThrow();
  });

  it('does not write cache entries during successful render-only integration path', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<Leaderboard contributors={contributors} />);

    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });
});
