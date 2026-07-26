import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt = '', src = '', ...props }: ComponentProps<'img'>) => (
    /* eslint-disable @next/next/no-img-element */
    <img alt={alt} src={src} {...props} />
  ),
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
const mockContributors: Contributor[] = [
  {
    id: 1,
    login: 'gold_dev',
    avatar_url: '/gold.png',
    contributions: 150,
    html_url: 'https://github.com/gold_dev',
  },
  {
    id: 2,
    login: 'silver_dev',
    avatar_url: '/silver.png',
    contributions: 120,
    html_url: 'https://github.com/silver_dev',
  },
  {
    id: 3,
    login: 'bronze_dev',
    avatar_url: '/bronze.png',
    contributions: 90,
    html_url: 'https://github.com/bronze_dev',
  },
  {
    id: 4,
    login: 'runner4_dev',
    avatar_url: '/runner4.png',
    contributions: 60,
    html_url: 'https://github.com/runner4_dev',
  },
  {
    id: 5,
    login: 'runner5_dev',
    avatar_url: '/runner5.png',
    contributions: 30,
    html_url: 'https://github.com/runner5_dev',
  },
];

describe('Leaderboard Component', () => {
  it('renders rank 1, 2, and 3 podium items when there are 3 or more contributors', () => {
    render(<Leaderboard contributors={mockContributors} />);

    // Check for rank 1
    expect(screen.getByText('gold_dev')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByAltText('gold_dev')).toHaveAttribute('src', '/gold.png');

    // Check for rank 2
    expect(screen.getByText('silver_dev')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByAltText('silver_dev')).toHaveAttribute('src', '/silver.png');

    // Check for rank 3
    expect(screen.getByText('bronze_dev')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByAltText('bronze_dev')).toHaveAttribute('src', '/bronze.png');
  });

  it('renders only rank 1 podium when there is only 1 contributor', () => {
    render(<Leaderboard contributors={[mockContributors[0]]} />);

    expect(screen.getByText('gold_dev')).toBeInTheDocument();
    expect(screen.queryByText('silver_dev')).not.toBeInTheDocument();
    expect(screen.queryByText('bronze_dev')).not.toBeInTheDocument();
  });

  it('renders rank 1 and 2 podiums when there are exactly 2 contributors', () => {
    render(<Leaderboard contributors={[mockContributors[0], mockContributors[1]]} />);

    expect(screen.getByText('gold_dev')).toBeInTheDocument();
    expect(screen.getByText('silver_dev')).toBeInTheDocument();
    expect(screen.queryByText('bronze_dev')).not.toBeInTheDocument();
  });

  it('renders contributors ranked 4 or below in the entries list', () => {
    render(<Leaderboard contributors={mockContributors} />);

    // Ranks 4 and 5 should be in the list
    expect(screen.getByText('runner4_dev')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();

    expect(screen.getByText('runner5_dev')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });

  it('opens contributor GitHub profile in new tab when list entry is clicked', () => {
    const openMock = vi.fn();
    const originalOpen = window.open;
    window.open = openMock;

    render(<Leaderboard contributors={mockContributors} />);

    const entryElement = screen.getByText('runner4_dev').closest('.cursor-pointer');
    expect(entryElement).toBeTruthy();

    fireEvent.click(entryElement!);

    expect(openMock).toHaveBeenCalledWith(
      'https://github.com/runner4_dev',
      '_blank',
      'noopener,noreferrer'
    );

    // Restore original window.open
    window.open = originalOpen;
  });

  //since sorted array is passes to leaderboard
  //would test that render order matches input order
  it('renders contributors preserving the input order', () => {
    render(<Leaderboard contributors={mockContributors} />);

    // rank1
    expect(screen.getByText('gold_dev')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    // rank2
    expect(screen.getByText('silver_dev')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    // list entries preserve order
    const rank4 = screen.getByText('#4');
    const rank5 = screen.getByText('#5');
    expect(rank4).toBeInTheDocument();
    expect(rank5).toBeInTheDocument();

    // #4 appears before #5 in the DOM
    expect(rank4.compareDocumentPosition(rank5) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders nothing in podium and list when contributors array is empty', () => {
    render(<Leaderboard contributors={[]} />);

    expect(screen.queryByText('gold_dev')).not.toBeInTheDocument();
    expect(screen.queryByText('silver_dev')).not.toBeInTheDocument();
    expect(screen.queryByText('bronze_dev')).not.toBeInTheDocument();
    expect(screen.queryByText('#4')).not.toBeInTheDocument();
    expect(screen.queryByText('#5')).not.toBeInTheDocument();
  });

  it('renders crown icons for top 3 podium positions', () => {
    const { container } = render(<Leaderboard contributors={mockContributors} />);

    const crowns = container.querySelectorAll('svg');
    // there should be crown SVGs present for rank 1, 2, 3
    expect(crowns.length).toBeGreaterThanOrEqual(3);
  });
});
