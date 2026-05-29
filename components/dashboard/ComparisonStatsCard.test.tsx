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
});
