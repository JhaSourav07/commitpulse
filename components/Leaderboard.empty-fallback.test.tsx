import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt = '', src = '', fill, ...props }: ComponentProps<'img'> & { fill?: boolean }) => {
    void fill;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} {...props} />;
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileInView,
      ...props
    }: {
      children?: ReactNode;
      whileHover?: unknown;
      whileInView?: unknown;
      [key: string]: unknown;
    }) => (
      <div
        {...props}
        data-while-hover={JSON.stringify(whileHover)}
        data-while-in-view={JSON.stringify(whileInView)}
      >
        {children}
      </div>
    ),
  },
}));

describe('Leaderboard - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('renders successfully and avoids crashing when contributors is an empty array', () => {
    expect(() => render(<Leaderboard contributors={[]} />)).not.toThrow();

    // Verify no podium or list members are present
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/commits/i)).not.toBeInTheDocument();
  });

  it('renders successfully when contributors parameter is undefined/omitted', () => {
    expect(() =>
      render(<Leaderboard contributors={undefined as unknown as Contributor[]} />)
    ).not.toThrow();
    expect(() =>
      render(<Leaderboard {...({} as unknown as ComponentProps<typeof Leaderboard>)} />)
    ).not.toThrow();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders successfully when contributors parameter is null', () => {
    expect(() =>
      render(<Leaderboard contributors={null as unknown as Contributor[]} />)
    ).not.toThrow();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('preserves layout structures and standard visual styles in the empty fallback state', () => {
    const { container } = render(<Leaderboard contributors={[]} />);

    // Verify ambient glows and backdrop styling elements exist
    const baseWrapper = container.firstChild as HTMLElement;
    expect(baseWrapper).toBeInTheDocument();
    expect(baseWrapper).toHaveClass('backdrop-blur-xl');
    expect(baseWrapper).toHaveClass('rounded-[2rem]');

    // Ambient background glow container
    const glows = baseWrapper.querySelector('div.absolute');
    expect(glows).toBeInTheDocument();
  });

  it('handles partial lists safely when contributors count is fewer than 3', () => {
    const singleContributor: Contributor[] = [
      {
        id: 101,
        login: 'solo_coder',
        avatar_url: '/solo.png',
        contributions: 42,
        html_url: 'https://github.com/solo_coder',
      },
    ];

    const { unmount: unmountSingle } = render(<Leaderboard contributors={singleContributor} />);
    expect(screen.getByText('solo_coder')).toBeInTheDocument();
    expect(screen.queryByText('silver_dev')).not.toBeInTheDocument();
    expect(screen.queryByText('bronze_dev')).not.toBeInTheDocument();
    unmountSingle();

    const twoContributors: Contributor[] = [
      {
        id: 101,
        login: 'solo_coder',
        avatar_url: '/solo.png',
        contributions: 42,
        html_url: 'https://github.com/solo_coder',
      },
      {
        id: 102,
        login: 'pair_partner',
        avatar_url: '/partner.png',
        contributions: 31,
        html_url: 'https://github.com/pair_partner',
      },
    ];

    const { unmount: unmountTwo } = render(<Leaderboard contributors={twoContributors} />);
    expect(screen.getByText('solo_coder')).toBeInTheDocument();
    expect(screen.getByText('pair_partner')).toBeInTheDocument();

    // Verify list items (rank #4+) do not exist
    expect(screen.queryByText('#4')).not.toBeInTheDocument();
    unmountTwo();
  });
});
