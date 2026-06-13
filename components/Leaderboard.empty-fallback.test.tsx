import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt = '', src = '', fill, ...props }: ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
    }
  ),
}));

describe('Leaderboard Empty Fallback', () => {
  const contributor: Contributor = {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.png',
    contributions: 100,
    html_url: 'https://github.com/testuser',
  };

  it('renders without crashing when contributors array is empty', () => {
    const { container } = render(<Leaderboard contributors={[]} />);

    expect(container).toBeInTheDocument();
  });

  it('renders no contributor names when contributors array is empty', () => {
    render(<Leaderboard contributors={[]} />);

    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });

  it('renders a single contributor correctly', () => {
    render(<Leaderboard contributors={[contributor]} />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders fallback avatar container when avatar_url is empty', () => {
    const contributorWithoutAvatar: Contributor = {
      ...contributor,
      avatar_url: '',
    };

    render(<Leaderboard contributors={[contributorWithoutAvatar]} />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render list entries when fewer than four contributors exist', () => {
    render(<Leaderboard contributors={[contributor]} />);

    expect(screen.queryByText('#4')).not.toBeInTheDocument();
  });
});
