/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.whileInView;
      delete props.viewport;
      delete props.whileHover;
      delete props.transition;

      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  },
}));

vi.mock('lucide-react', () => ({
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  GitCommit: (props: any) => <div data-testid="icon-git-commit" {...props} />,
  LucideIcon: () => null,
}));

describe('StatsCard Timezone Boundaries', () => {
  it('renders leap year UTC date correctly', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
        showUTCDisclaimer
        utcDate="2024-02-29"
      />
    );

    expect(screen.getByText(/UTC Date: 2024-02-29/)).toBeDefined();
  });

  it('renders daylight saving transition date correctly', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
        showUTCDisclaimer
        utcDate="2024-03-10"
      />
    );

    expect(screen.getByText(/UTC Date: 2024-03-10/)).toBeDefined();
  });

  it('renders end of year boundary date correctly', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
        showUTCDisclaimer
        utcDate="2024-12-31"
      />
    );

    expect(screen.getByText(/UTC Date: 2024-12-31/)).toBeDefined();
  });

  it('renders new year boundary date correctly', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
        showUTCDisclaimer
        utcDate="2025-01-01"
      />
    );

    expect(screen.getByText(/UTC Date: 2025-01-01/)).toBeDefined();
  });

  it('preserves UTC date string exactly without modification', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
        showUTCDisclaimer
        utcDate="2024-06-15"
      />
    );

    expect(screen.getByText('UTC Date: 2024-06-15')).toBeDefined();
  });
});
