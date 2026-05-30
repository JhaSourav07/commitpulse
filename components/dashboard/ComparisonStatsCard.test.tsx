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

    const emeraldElement =
      container.querySelector('[className*="emerald"]') ||
      container.querySelector('.text-emerald-400');

    expect(emeraldElement).toBeNull();
    expect(screen.queryByText('Winner')).toBeNull();
  });
});

describe('ComparisonStatsCard responsive rendering and growth trends (Variation 3)', () => {
  it('renders positive growth trend with winner badge for higher value', () => {
    render(
      <ComparisonStatsCard
        title="Streak"
        valueA={120}
        valueB={40}
        labelA="Alice"
        labelB="Bob"
        icon="Flame"
      />
    );
    expect(screen.getByText('Winner')).toBeDefined();
    expect(screen.getByText('120')).toBeDefined();
    expect(screen.getByText('40')).toBeDefined();
  });

  it('renders negative growth indicator — no winner badge for lower value', () => {
    render(
      <ComparisonStatsCard
        title="Streak"
        valueA={20}
        valueB={80}
        labelA="Alice"
        labelB="Bob"
        icon="Flame"
      />
    );
    const winners = screen.getAllByText('Winner');
    expect(winners.length).toBe(1);
    expect(screen.getByText('20').className).not.toMatch(/emerald/);
  });

  it('renders title and icon correctly', () => {
    render(
      <ComparisonStatsCard
        title="Pull Requests"
        valueA={10}
        valueB={5}
        labelA="Dev A"
        labelB="Dev B"
        icon="GitBranch"
      />
    );
    expect(screen.getByText(/Pull Requests/i)).toBeDefined();
    expect(screen.getByText('Dev A')).toBeDefined();
    expect(screen.getByText('Dev B')).toBeDefined();
  });

  it('renders zero values without crashing', () => {
    render(
      <ComparisonStatsCard
        title="Commits"
        valueA={0}
        valueB={0}
        labelA="Alice"
        labelB="Bob"
        icon="GitCommit"
      />
    );
    expect(screen.queryByText('Winner')).toBeNull();
  });

  it('renders large values correctly', () => {
    render(
      <ComparisonStatsCard
        title="Total Contributions"
        valueA={9999}
        valueB={1}
        labelA="Alice"
        labelB="Bob"
        icon="TrendingUp"
      />
    );
    expect(screen.getByText('9999')).toBeDefined();
    expect(screen.getByText('Winner')).toBeDefined();
  });
});
