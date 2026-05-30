/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ComparisonStatsCard from './ComparisonStatsCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;
      delete props.whileHover;

      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    },
  },
}));

describe('ComparisonStatsCard', () => {
  it('renders correctly with title, labels and values', () => {
    render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={85}
        valueB={72}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    expect(screen.getByText(/Developer Score/i)).toBeDefined();
    expect(screen.getByText('User One')).toBeDefined();
    expect(screen.getByText('User Two')).toBeDefined();
    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText('72')).toBeDefined();
  });

  it('renders a Winner badge on User One when valueA is greater', () => {
    render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={100}
        valueB={50}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    const winnerBadges = screen.getAllByText('Winner');
    expect(winnerBadges.length).toBe(1);
    expect(screen.getByText('100').parentElement?.innerHTML).toContain('Winner');
  });

  it('renders a Winner badge on User Two when valueB is greater', () => {
    render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={30}
        valueB={90}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    const winnerBadges = screen.getAllByText('Winner');
    expect(winnerBadges.length).toBe(1);
    expect(screen.getByText('90').parentElement?.innerHTML).toContain('Winner');
  });

  it('does not render any Winner badge if values are equal', () => {
    render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={50}
        valueB={50}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    expect(screen.queryByText('Winner')).toBeNull();
  });
  it('renders neutral fallback progress bar when both values are zero', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={0}
        valueB={0}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    const fallbackBar = container.querySelector('.bg-gray-700\\/50');

    expect(fallbackBar).toBeDefined();
  });

  it('renders both progress bar segments when total is greater than zero', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={75}
        valueB={25}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    const userOneSegment = container.querySelector('.bg-cyan-400');
    const userTwoSegment = container.querySelector('.bg-purple-400');

    expect(userOneSegment).toBeDefined();
    expect(userTwoSegment).toBeDefined();
  });

  it('renders a balanced 50/50 split progress bar without any emerald color highlight when values are equal', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={50}
        valueB={50}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    const progressSegments = container.querySelectorAll(
      '.w-full.bg-gray-700\\/50 div, .relative div'
    );

    const allDivs = Array.from(container.querySelectorAll('div'));

    const emeraldElement =
      container.querySelector('[className*="emerald"]') ||
      container.querySelector('.text-emerald-400');

    expect(emeraldElement).toBeNull();
    expect(screen.queryByText('Winner')).toBeNull();
  });
});
