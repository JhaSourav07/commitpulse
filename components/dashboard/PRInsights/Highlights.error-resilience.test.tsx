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
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children?: React.ReactNode;
    }) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition'].includes(key)) {
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
  MessageSquare: () => <span data-testid="message-icon" />,
  Zap: () => <span data-testid="zap-icon" />,
  HardDrive: () => <span data-testid="drive-icon" />,
  ArrowRight: () => <span data-testid="arrow-icon" />,
}));

const populatedHighlights: PRInsightData['highlights'] = {
  fastestMerged: {
    title: 'Fast merge',
    url: 'https://example.com/1',
    time: 1.5,
  },
  mostDiscussed: {
    title: 'Discussion PR',
    url: 'https://example.com/2',
    comments: 18,
  },
  largest: {
    title: 'Largest PR',
    url: 'https://example.com/3',
    additions: 250,
    deletions: 75,
  },
};

describe('Highlights error resilience', () => {
  it('renders arrow icons only for populated highlight cards', () => {
    render(<Highlights highlights={populatedHighlights} />);

    expect(screen.getAllByTestId('arrow-icon')).toHaveLength(3);
  });

  it('does not render arrow icons when highlight data is unavailable', () => {
    render(
      <Highlights
        highlights={{
          fastestMerged: undefined,
          mostDiscussed: undefined,
          largest: undefined,
        }}
      />
    );

    expect(screen.queryByTestId('arrow-icon')).not.toBeInTheDocument();
  });

  it('applies disabled styling only to cards without highlight data', () => {
    const { container } = render(
      <Highlights
        highlights={{
          fastestMerged: populatedHighlights.fastestMerged,
          mostDiscussed: undefined,
          largest: undefined,
        }}
      />
    );

    const cards = container.querySelectorAll('a');

    expect(cards).toHaveLength(3);

    expect(cards[0]).not.toHaveClass('opacity-50');
    expect(cards[0]).not.toHaveClass('cursor-not-allowed');

    expect(cards[1]).toHaveClass('opacity-50');
    expect(cards[1]).toHaveClass('cursor-not-allowed');

    expect(cards[2]).toHaveClass('opacity-50');
    expect(cards[2]).toHaveClass('cursor-not-allowed');
  });

  it('renders enabled and disabled cards together without affecting populated cards', () => {
    render(
      <Highlights
        highlights={{
          fastestMerged: populatedHighlights.fastestMerged,
          mostDiscussed: undefined,
          largest: populatedHighlights.largest,
        }}
      />
    );

    expect(screen.getAllByTestId('arrow-icon')).toHaveLength(2);

    expect(screen.getByText('Fast merge')).toBeInTheDocument();
    expect(screen.getByText('Largest PR')).toBeInTheDocument();

    expect(screen.getAllByText('N/A')).toHaveLength(1);
    expect(screen.getAllByText('No data available')).toHaveLength(1);
  });
});
