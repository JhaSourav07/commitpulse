import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';

import Leaderboard from './Leaderboard';

vi.mock('next/image', () => ({
  default: () => null,
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
    }: HTMLAttributes<HTMLDivElement> & {
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

describe('Leaderboard theme contrast behavior', () => {
  const contributors = [
    {
      id: 1,
      login: 'alice',
      avatar_url: 'https://example.com/alice.png',
      contributions: 100,
      html_url: 'https://github.com/alice',
    },
    {
      id: 2,
      login: 'bob',
      avatar_url: 'https://example.com/bob.png',
      contributions: 90,
      html_url: 'https://github.com/bob',
    },
    {
      id: 3,
      login: 'charlie',
      avatar_url: 'https://example.com/charlie.png',
      contributions: 80,
      html_url: 'https://github.com/charlie',
    },
    {
      id: 4,
      login: 'david',
      avatar_url: 'https://example.com/david.png',
      contributions: 70,
      html_url: 'https://github.com/david',
    },
  ];

  it('renders leaderboard container', () => {
    const { container } = render(<Leaderboard contributors={contributors} />);

    expect(container.firstChild).toBeTruthy();
  });

  it('includes dark mode background classes', () => {
    const { container } = render(<Leaderboard contributors={contributors} />);

    expect(container.innerHTML).toContain('dark:bg');
  });

  it('includes dark mode text classes', () => {
    const { container } = render(<Leaderboard contributors={contributors} />);

    expect(container.innerHTML).toContain('dark:text-white');
  });

  it('includes dark mode border classes', () => {
    const { container } = render(<Leaderboard contributors={contributors} />);

    expect(container.innerHTML).toContain('dark:border');
  });

  it('includes hover contrast styling for both themes', () => {
    const { container } = render(<Leaderboard contributors={contributors} />);

    expect(container.innerHTML).toContain('dark:hover');
  });
});
