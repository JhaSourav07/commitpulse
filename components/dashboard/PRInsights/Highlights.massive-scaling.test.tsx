import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Highlights from './Highlights';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    a: ({
      children,
      className,
      href,
      target,
      rel,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition', 'whileInView', 'viewport'].includes(key)) {
            acc[key] = (props as Record<string, unknown>)[key];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
      return (
        <a className={className} href={href} target={target} rel={rel} {...validProps}>
          {children}
        </a>
      );
    },
  },
}));

vi.mock('lucide-react', () => ({
  MessageSquare: () => <svg data-testid="icon-message-square" />,
  Zap: () => <svg data-testid="icon-zap" />,
  HardDrive: () => <svg data-testid="icon-hard-drive" />,
  ArrowRight: () => <svg data-testid="icon-arrow-right" />,
}));

function buildMassiveHighlights(
  overrides: Partial<PRInsightData['highlights']> = {}
): PRInsightData['highlights'] {
  return {
    fastestMerged: {
      title: 'A'.repeat(10000),
      url: 'https://github.com/org/repo/pull/1',
      time: 0.001,
    },
    mostDiscussed: {
      title: 'B'.repeat(10000),
      url: 'https://github.com/org/repo/pull/2',
      comments: 999999,
    },
    largest: {
      title: 'C'.repeat(10000),
      url: 'https://github.com/org/repo/pull/3',
      additions: 999999,
      deletions: 888888,
    },
    ...overrides,
  };
}

describe('Highlights Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders all three cards with extreme high bounds values without layout breakage', () => {
    render(<Highlights highlights={buildMassiveHighlights()} />);

    expect(screen.getByText('Fastest Merged PR')).toBeInTheDocument();
    expect(screen.getByText('Most Discussed')).toBeInTheDocument();
    expect(screen.getByText('Largest Impact')).toBeInTheDocument();

    expect(screen.getByText('0.0 hrs')).toBeInTheDocument();
    expect(screen.getByText(/999999.*comments/)).toBeInTheDocument();
    expect(screen.getByText('+999999 -888888')).toBeInTheDocument();
  });

  it('renders extremely long PR titles without crashing using line-clamp', () => {
    const { container } = render(<Highlights highlights={buildMassiveHighlights()} />);

    const clampedElements = container.querySelectorAll('.line-clamp-2');
    expect(clampedElements.length).toBeGreaterThan(0);

    clampedElements.forEach((el) => {
      expect(el.textContent?.length).toBeGreaterThan(0);
    });
  });

  it('renders gracefully when all highlight fields are undefined', () => {
    render(
      <Highlights
        highlights={{ fastestMerged: undefined, mostDiscussed: undefined, largest: undefined }}
      />
    );

    expect(screen.getAllByText('N/A')).toHaveLength(3);
    expect(screen.getAllByText('No data available')).toHaveLength(3);
  });

  it('all card links point to correct URLs under massive data', () => {
    render(<Highlights highlights={buildMassiveHighlights()} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute('href', 'https://github.com/org/repo/pull/1');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/org/repo/pull/2');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/org/repo/pull/3');
  });

  it('falls back to # href when highlight data is undefined', () => {
    render(
      <Highlights
        highlights={{ fastestMerged: undefined, mostDiscussed: undefined, largest: undefined }}
      />
    );

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '#');
    });
  });
});
