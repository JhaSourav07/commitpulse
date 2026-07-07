import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContributorsSearch from './ContributorsSearch';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  /* eslint-disable @next/next/no-img-element */
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

const createContributors = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    login: `contributor-${index}`,
    avatar_url: `https://example.com/avatar-${index}.png`,
    contributions: index * 10,
    html_url: `https://github.com/contributor-${index}`,
  }));

describe('ContributorsSearch massive scaling', () => {
  it('renders thousands of contributors without crashing', () => {
    const contributors = createContributors(2000);

    render(<ContributorsSearch contributors={contributors} />);

    expect(screen.getByText('2000 of 2000 contributors')).toBeInTheDocument();

    expect(screen.getByText('contributor-0')).toBeInTheDocument();
    expect(screen.getByText('contributor-1999')).toBeInTheDocument();
  });

  it('filters correctly within a large contributor dataset', () => {
    const contributors = createContributors(3000);

    render(<ContributorsSearch contributors={contributors} />);

    const input = screen.getByRole('textbox');

    fireEvent.change(input, {
      target: {
        value: 'contributor-2999',
      },
    });

    expect(screen.getByText('1 of 3000 contributors')).toBeInTheDocument();

    expect(screen.getByText('contributor-2999')).toBeInTheDocument();
  });

  it('renders a large number of profile cards while preserving layout structure', () => {
    const contributors = createContributors(1000);

    const { container } = render(<ContributorsSearch contributors={contributors} />);

    const links = container.querySelectorAll('a[href]');

    expect(links.length).toBe(1000);

    const grid = container.querySelector('.grid.grid-cols-1');

    expect(grid).toBeInTheDocument();
  });

  it('shows no-results state efficiently on large datasets', () => {
    const contributors = createContributors(5000);

    render(<ContributorsSearch contributors={contributors} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: 'non-existent-user-999999',
      },
    });

    expect(screen.getByText('No architects found')).toBeInTheDocument();

    expect(screen.getByText(/Try a different search query/i)).toBeInTheDocument();
  });

  it('maintains acceptable filtering performance under high-volume searches', () => {
    const contributors = createContributors(5000);

    render(<ContributorsSearch contributors={contributors} />);

    const input = screen.getByRole('textbox');

    const start = performance.now();

    fireEvent.change(input, {
      target: {
        value: 'contributor-4999',
      },
    });

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(process.env.CI ? 10000 : 5000);

    expect(screen.getByText('contributor-4999')).toBeInTheDocument();
  });
});
