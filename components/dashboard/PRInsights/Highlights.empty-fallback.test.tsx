import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Highlights from './Highlights';

vi.mock('framer-motion', () => ({
  motion: {
    a: ({ children, className, href, target, rel, ...props }: Record<string, unknown>) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition'].includes(key)) {
            (acc as Record<string, unknown>)[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
      return (
        <a
          href={href as string}
          target={target as string}
          rel={rel as string}
          className={className as string}
          {...validProps}
        >
          {children as React.ReactNode}
        </a>
      );
    },
  },
}));

describe('Highlights - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. renders without crashing when all highlights are undefined', () => {
    render(<Highlights highlights={{}} />);
    expect(screen.getByText('Fastest Merged PR')).toBeTruthy();
    expect(screen.getByText('Most Discussed')).toBeTruthy();
    expect(screen.getByText('Largest Impact')).toBeTruthy();
  });

  it('2. displays N/A for value and "No data available" for description when highlights are missing', () => {
    render(<Highlights highlights={{}} />);
    const naValues = screen.getAllByText('N/A');
    expect(naValues.length).toBe(3);
    const noData = screen.getAllByText('No data available');
    expect(noData.length).toBe(3);
  });

  it('3. renders with only fastestMerged highlight and partial data', () => {
    render(
      <Highlights
        highlights={{
          fastestMerged: {
            title: 'Quick fix',
            url: 'https://github.com/test/repo/pull/1',
            time: 1.5,
          },
        }}
      />
    );
    expect(screen.getByText('Quick fix')).toBeTruthy();
    expect(screen.getByText('1.5 hrs')).toBeTruthy();
    expect(screen.getAllByText('N/A').length).toBe(2);
    expect(screen.getAllByText('No data available').length).toBe(2);
  });

  it('4. renders with only mostDiscussed highlight', () => {
    render(
      <Highlights
        highlights={{
          mostDiscussed: {
            title: 'Hot debate PR',
            url: 'https://github.com/test/repo/pull/2',
            comments: 25,
          },
        }}
      />
    );
    expect(screen.getByText('Hot debate PR')).toBeTruthy();
    expect(screen.getByText('25 comments')).toBeTruthy();
  });

  it('5. renders with only largest highlight and displays code diff stats', () => {
    render(
      <Highlights
        highlights={{
          largest: {
            title: 'Big refactor',
            url: 'https://github.com/test/repo/pull/3',
            additions: 500,
            deletions: 200,
          },
        }}
      />
    );
    expect(screen.getByText('Big refactor')).toBeTruthy();
    expect(screen.getByText('+500 -200')).toBeTruthy();
  });

  it('6. applies correct link href and opens in new tab when data is available', () => {
    render(
      <Highlights
        highlights={{
          fastestMerged: {
            title: 'Fix bug',
            url: 'https://github.com/test/repo/pull/10',
            time: 2.0,
          },
        }}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/test/repo/pull/10');
    expect(links[0]).toHaveAttribute('target', '_blank');
  });
});
