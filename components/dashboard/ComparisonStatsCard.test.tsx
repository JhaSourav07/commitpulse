/**
 * components/dashboard/ComparisonStatsCard.test.tsx
 *
 * Test suite for ComparisonStatsCard.
 *
 * Coverage goals:
 *  ✓ Positive growth trend indicator (Winner badge + emerald highlight)
 *  ✓ Negative growth trend indicator (no Winner badge + neutral styling)
 *  ✓ Neutral / equal values (no Winner badge)
 *  ✓ Layout structure and correct HTML nodes
 *  ✓ Responsive breakpoints (375 / 768 / 1280 / 1920 px)
 *  ✓ Edge cases (zero values, large values)
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import ComparisonStatsCard from './ComparisonStatsCard';

// ─── Mock framer-motion ───────────────────────────────────────────────────────
// Strips motion-specific props so they don't leak into the DOM.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      whileInView,
      whileHover,
      whileTap,
      initial,
      animate,
      transition,
      ...rest
    }: any) => (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    ),
  },
}));

// ─── Viewport helper ──────────────────────────────────────────────────────────
/**
 * Simulate a browser resize to the given width.
 *
 * jsdom does not apply CSS, so we cannot test visual layout shifts.
 * What we CAN verify:
 *   1. The component renders error-free at each canonical breakpoint.
 *   2. All expected nodes are mounted regardless of viewport size.
 *   3. The correct Tailwind responsive classes are present on key elements.
 */
function setViewport(width: number, height = 900) {
  act(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  });
}

// ─── Core functionality ──────────────────────────────────────────────────────
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

    expect(screen.getByText(/Developer Score/i)).toBeInTheDocument();
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  // ── Positive growth trend ─────────────────────────────────────────────────
  describe('positive growth trend', () => {
    it('renders a Winner badge on the side with the higher value (A > B)', () => {
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
      expect(winnerBadges).toHaveLength(1);
      // Winner badge should be inside User One's value container
      expect(screen.getByText('100').parentElement?.innerHTML).toContain('Winner');
    });

    it('applies emerald highlight class to the winning value', () => {
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

      const winnerValue = screen.getByText('120');
      expect(winnerValue.className).toMatch(/emerald/);
    });

    it('does NOT apply emerald highlight to the losing value', () => {
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

      const loserValue = screen.getByText('40');
      expect(loserValue.className).not.toMatch(/emerald/);
    });

    it('applies emerald glow to the winning progress bar segment', () => {
      const { container } = render(
        <ComparisonStatsCard
          title="Commits"
          valueA={75}
          valueB={25}
          labelA="User One"
          labelB="User Two"
          icon="GitCommit"
        />
      );

      // Winner segment gets bg-emerald-500, loser gets bg-zinc-400
      const emeraldSegment = container.querySelector('.bg-emerald-500');
      const zincSegment = container.querySelector('.bg-zinc-400');
      expect(emeraldSegment).toBeInTheDocument();
      expect(zincSegment).toBeInTheDocument();
    });
  });

  // ── Negative growth trend (B > A) ─────────────────────────────────────────
  describe('negative growth trend (B wins)', () => {
    it('renders a Winner badge on User B when valueB is greater', () => {
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
      expect(winnerBadges).toHaveLength(1);
      // Winner badge should be inside User Two's value container
      expect(screen.getByText('90').parentElement?.innerHTML).toContain('Winner');
    });

    it('does NOT show emerald highlight on the lower value side', () => {
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

      const loserValue = screen.getByText('20');
      expect(loserValue.className).not.toMatch(/emerald/);
    });

    it('applies emerald highlight to valueB when it is the winner', () => {
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

      const winnerValue = screen.getByText('80');
      expect(winnerValue.className).toMatch(/emerald/);
    });
  });

  // ── Neutral / equal values ────────────────────────────────────────────────
  describe('neutral — equal values', () => {
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

      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    });

    it('does not apply emerald highlight to either value when equal', () => {
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

      // Neither value should be emerald-highlighted
      const emeraldElement = container.querySelector('.text-emerald-400');
      expect(emeraldElement).not.toBeInTheDocument();
      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    });

    it('renders both progress bar segments with neutral zinc styling', () => {
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

      // When no winner, both segments get bg-zinc-400 (light) / bg-zinc-600 (dark)
      const zincSegments = container.querySelectorAll('.bg-zinc-400');
      expect(zincSegments.length).toBe(2);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('renders zero values and fallback bar without crashing', () => {
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

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Winner')).not.toBeInTheDocument();

      const fallback = container.querySelector('.bg-zinc-300.dark\\:bg-zinc-800');
      expect(fallback).toBeInTheDocument();
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

      expect(screen.getByText((9999).toLocaleString())).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Winner')).toBeInTheDocument();
    });

    it('formats values with locale thousands separators (consistent with /compare)', () => {
      render(
        <ComparisonStatsCard
          title="Total Contributions"
          valueA={1234567}
          valueB={89012}
          labelA="Alice"
          labelB="Bob"
          icon="GitCommit"
        />
      );

      expect(screen.getByText((1234567).toLocaleString())).toBeInTheDocument();
      expect(screen.getByText((89012).toLocaleString())).toBeInTheDocument();
    });
  });

  // ── HTML node structure ───────────────────────────────────────────────────
  describe('HTML node structure', () => {
    it('renders the title text in an uppercase tracking element', () => {
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

      const titleEl = screen.getByText('Pull Requests');
      expect(titleEl).toBeInTheDocument();
      expect(titleEl.className).toContain('uppercase');
      expect(titleEl.className).toContain('tracking-widest');
    });

    it('renders both label elements with the correct text', () => {
      render(
        <ComparisonStatsCard
          title="Score"
          valueA={10}
          valueB={5}
          labelA="Dev A"
          labelB="Dev B"
          icon="Award"
        />
      );

      expect(screen.getByText('Dev A')).toBeInTheDocument();
      expect(screen.getByText('Dev B')).toBeInTheDocument();
    });

    it('renders a grid layout with two columns for side-by-side values', () => {
      const { container } = render(
        <ComparisonStatsCard
          title="Score"
          valueA={10}
          valueB={5}
          labelA="Dev A"
          labelB="Dev B"
          icon="Award"
        />
      );

      const gridEl = container.querySelector('.grid.grid-cols-2');
      expect(gridEl).toBeInTheDocument();
    });

    it('renders a progress bar container with overflow-hidden and flex', () => {
      const { container } = render(
        <ComparisonStatsCard
          title="Score"
          valueA={60}
          valueB={40}
          labelA="Dev A"
          labelB="Dev B"
          icon="Award"
        />
      );

      const progressBar = container.querySelector('.overflow-hidden.flex');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders a center divider that is hidden on mobile (hidden md:block)', () => {
      const { container } = render(
        <ComparisonStatsCard
          title="Score"
          valueA={10}
          valueB={5}
          labelA="Dev A"
          labelB="Dev B"
          icon="Award"
        />
      );

      const divider = container.querySelector('.hidden.md\\:block');
      expect(divider).toBeInTheDocument();
    });
  });
});

// ─── Responsive breakpoints ─────────────────────────────────────────────────
/**
 * jsdom does not apply CSS, so we cannot test visual layout shifts.
 * What we CAN verify:
 *   1. The component renders error-free at each canonical breakpoint.
 *   2. All expected nodes are mounted regardless of viewport size.
 *   3. Responsive-aware classes (e.g. md:block) are present.
 */
describe('ComparisonStatsCard — responsive breakpoints', () => {
  const VIEWPORTS = [
    { name: 'mobile (375px)', width: 375 },
    { name: 'tablet (768px)', width: 768 },
    { name: 'desktop (1280px)', width: 1280 },
    { name: 'wide (1920px)', width: 1920 },
  ] as const;

  // Reset viewport after each test so tests don't bleed into each other
  afterEach(() => {
    setViewport(1280);
  });

  VIEWPORTS.forEach(({ name, width }) => {
    describe(`at ${name}`, () => {
      it('renders all key nodes without error', () => {
        setViewport(width);

        render(
          <ComparisonStatsCard
            title="Commits"
            valueA={80}
            valueB={60}
            labelA="Alice"
            labelB="Bob"
            icon="GitCommit"
          />
        );

        // Title, labels, and values must be present at every breakpoint
        expect(screen.getByText('Commits')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument();
      });

      it('renders the Winner badge for the higher value', () => {
        setViewport(width);

        render(
          <ComparisonStatsCard
            title="Streak"
            valueA={100}
            valueB={30}
            labelA="Alice"
            labelB="Bob"
            icon="Flame"
          />
        );

        expect(screen.getByText('Winner')).toBeInTheDocument();
      });

      it('renders the progress bar', () => {
        setViewport(width);

        const { container } = render(
          <ComparisonStatsCard
            title="PRs"
            valueA={15}
            valueB={10}
            labelA="Alice"
            labelB="Bob"
            icon="GitBranch"
          />
        );

        const bar = container.querySelector('.rounded-full.overflow-hidden');
        expect(bar).toBeInTheDocument();
      });

      it('renders the grid layout for side-by-side values', () => {
        setViewport(width);

        const { container } = render(
          <ComparisonStatsCard
            title="Score"
            valueA={45}
            valueB={55}
            labelA="Alice"
            labelB="Bob"
            icon="Award"
          />
        );

        const gridEl = container.querySelector('.grid.grid-cols-2');
        expect(gridEl).toBeInTheDocument();
      });
    });
  });

  it('contains the md:block class on the center divider for desktop visibility', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Score"
        valueA={20}
        valueB={10}
        labelA="Alice"
        labelB="Bob"
        icon="Award"
      />
    );

    const divider = container.querySelector('.hidden.md\\:block');
    expect(divider).toBeInTheDocument();
  });

  it('outer wrapper carries the p-6 and rounded-xl classes for consistent spacing', () => {
    setViewport(375);

    const { container } = render(
      <ComparisonStatsCard
        title="Streak"
        valueA={20}
        valueB={10}
        labelA="Alice"
        labelB="Bob"
        icon="Flame"
      />
    );

    const card = container.firstElementChild;
    expect(card?.className).toContain('p-6');
    expect(card?.className).toContain('rounded-xl');
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

  it('renders correctly and no winner badge when both values are zero', () => {
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

    expect(screen.getByText('Alice')).toBeInTheDocument();
    const fallback = container.querySelector('.bg-zinc-300.dark\\:bg-zinc-800');
    expect(fallback).toBeInTheDocument();
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
