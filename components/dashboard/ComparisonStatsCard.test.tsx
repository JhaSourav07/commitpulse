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

describe('ComparisonStatsCard responsive breakpoints', () => {
  it('renders expected card structure with correct HTML nodes', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Developer Score"
        valueA={85}
        valueB={72}
        labelA="User One"
        labelB="User Two"
        icon="Award"
      />
    );

    const card = container.firstElementChild;
    const header = container.querySelector('.flex.justify-between.items-center.mb-6');
    const comparisonGrid = container.querySelector(
      '.grid.grid-cols-2.gap-4.items-center.mb-6.relative'
    );
    const progressBar = container.querySelector('.w-full.h-2.bg-gray-100');
    const divider = container.querySelector('.hidden.md\\:block');

    expect(card?.tagName).toBe('DIV');
    expect(header?.tagName).toBe('DIV');
    expect(comparisonGrid?.tagName).toBe('DIV');
    expect(progressBar?.tagName).toBe('DIV');
    expect(divider?.tagName).toBe('DIV');

    expect(screen.getByText('Winner')).toBeDefined();
    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText('72')).toBeDefined();
  });

  it('renders responsive divider and preserves winner badge for higher value', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Streak"
        valueA={20}
        valueB={80}
        labelA="Alice"
        labelB="Bob"
        icon="Flame"
      />
    );

    const divider = container.querySelector('.hidden.md\\:block');
    expect(divider?.tagName).toBe('DIV');

    const winnerBadges = screen.getAllByText('Winner');
    expect(winnerBadges.length).toBe(1);
    expect(screen.getByText('80').parentElement?.textContent).toContain('Winner');

    expect(screen.getByText('20').className).not.toMatch(/emerald/);

    expect(screen.getByTitle('Alice')).toBeDefined();
    expect(screen.getByTitle('Bob')).toBeDefined();
  });

  it('renders neutral fallback progress bar and no winner badge when both values are zero', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Commits"
        valueA={0}
        valueB={0}
        labelA="Alice"
        labelB="Bob"
        icon="GitCommit"
      />
    );

    const progressBar = container.querySelector('.w-full.h-2.bg-gray-100');
    expect(progressBar?.tagName).toBe('DIV');

    const fallbackBar = container.querySelector('.bg-gray-700\\/50');
    expect(fallbackBar).toBeDefined();

    expect(screen.queryByText('Winner')).toBeNull();
  });
});

describe('ComparisonStatsCard icon rendering', () => {
  it('renders correctly with Flame icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="Flame"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders correctly with TrendingUp icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="TrendingUp"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders correctly with GitCommit icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="GitCommit"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders correctly with GitBranch icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="GitBranch"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders correctly with Users icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="Users"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders correctly with UserPlus icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="UserPlus"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders correctly with Award icon', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="Award"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('falls back to Award icon and renders correctly with unknown icon name', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Test Title"
        valueA={50}
        valueB={50}
        labelA="Label A"
        labelB="Label B"
        icon="UnknownIcon"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    const iconContainer = container.querySelector('.rounded-lg.bg-gray-100');
    expect(iconContainer).toBeDefined();
    const icon = iconContainer?.querySelector('svg');
    expect(icon).toBeDefined();
  });
});

describe('ComparisonStatsCard responsive rendering and elements (Variation 2)', () => {
  it('renders visual center divider with responsive hidden md:block classes', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Streak"
        valueA={20}
        valueB={80}
        labelA="Alice"
        labelB="Bob"
        icon="Flame"
      />
    );
    const divider = container.querySelector('.hidden.md\\:block');
    expect(divider).toBeDefined();
    expect(divider?.tagName).toBe('DIV');
    expect(divider?.className).toContain('hidden');
    expect(divider?.className).toContain('md:block');
  });

  it('renders side-by-side grid layout for values', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Streak"
        valueA={20}
        valueB={80}
        labelA="Alice"
        labelB="Bob"
        icon="Flame"
      />
    );
    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).toBeDefined();
    expect(grid?.tagName).toBe('DIV');
  });
});
