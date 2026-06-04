import { render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';

vi.mock('next/image', () => ({
  default: ({ alt = '', ...props }: ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentProps<'div'> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const contributors: Contributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: '/avatar.png',
    contributions: 100,
    html_url: 'https://github.com/alice',
  },
];

describe('Leaderboard error resilience', () => {
  it('renders without crashing with valid contributor data', () => {
    expect(() => render(<Leaderboard contributors={contributors} />)).not.toThrow();
  });

  it('renders safely with an empty contributor array', () => {
    expect(() => render(<Leaderboard contributors={[]} />)).not.toThrow();
  });

  it('maintains stable hydration-safe rendering for empty state', () => {
    const { container } = render(<Leaderboard contributors={[]} />);

    expect(container).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  it('does not throw when contributor list contains minimal values', () => {
    const minimalContributors: Contributor[] = [
      {
        id: 1,
        login: '',
        avatar_url: '',
        contributions: 0,
        html_url: '',
      },
    ];

    expect(() => render(<Leaderboard contributors={minimalContributors} />)).not.toThrow();
  });

  it('survives repeated renders without runtime exceptions', () => {
    const { rerender } = render(<Leaderboard contributors={contributors} />);

    expect(() => rerender(<Leaderboard contributors={contributors} />)).not.toThrow();
  });
});
