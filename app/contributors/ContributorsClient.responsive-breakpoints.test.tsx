import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ContributorsClient from './ContributorsClient';

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
};

const mockContributors: Contributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
  {
    id: 3,
    login: 'carol',
    avatar_url: 'https://example.com/carol.png',
    contributions: 9,
    html_url: 'https://github.com/carol',
  },
];

const scrollTriggers = vi.hoisted(() => [{ kill: vi.fn() }]);

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => scrollTriggers,
  },
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { width?: number; height?: number }) =>
    React.createElement('img', { alt, src, ...props }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      animate?: unknown;
      exit?: unknown;
      initial?: unknown;
      layout?: unknown;
      transition?: unknown;
      variants?: unknown;
    }
  >(({ animate, exit, initial, layout, transition, variants, children, style, ...props }, ref) => {
    void animate;
    void exit;
    void initial;
    void layout;
    void transition;
    void variants;

    return (
      <div ref={ref} style={style} {...props}>
        {children}
      </div>
    );
  });
  MotionDiv.displayName = 'MotionDiv';

  const MotionSpan = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>;
  const MotionHeading = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & {
    animate?: unknown;
    initial?: unknown;
    transition?: unknown;
  }) => {
    const { animate, initial, transition, ...headingProps } = props;
    void animate;
    void initial;
    void transition;

    return <h1 {...headingProps}>{children}</h1>;
  };
  const MotionParagraph = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & {
    animate?: unknown;
    initial?: unknown;
    transition?: unknown;
  }) => {
    const { animate, initial, transition, ...paragraphProps } = props;
    void animate;
    void initial;
    void transition;

    return <p {...paragraphProps}>{children}</p>;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: MotionDiv,
      h1: MotionHeading,
      p: MotionParagraph,
      span: MotionSpan,
    },
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: (value: unknown) => value,
    useTransform: (_value: unknown, transform: (value: number) => number) => transform(0),
  };
});

const renderClient = () =>
  render(
    <ContributorsClient
      contributors={mockContributors}
      totalContributions={68}
      topContributors={mockContributors}
    />
  );

/**
 * Responsive Multi-device Columns & Mobile Viewport Layouts
 *
 * These tests simulate a 375px-wide mobile viewport (iPhone SE / standard mobile)
 * and verify that the ContributorsClient layout collapses gracefully:
 *   - Multi-column grids reflow into a single vertical flex/grid column.
 *   - Utility styling values remain relative (rem / % / vh) so no fixed pixel
 *     widths force a horizontal scrollbar at 375px.
 *   - Desktop-only navigation ornaments (like the custom cursor) scale down
 *     via `hidden md:block` so mobile users don't see stale desktop chrome.
 *   - Mobile-specific toggle states (hover -> tap fallbacks like `active:scale-95`)
 *     remain wired up so touch interactions still respond cleanly.
 */
describe('ContributorsClient - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Standard mobile-width viewport (iPhone SE class devices are 375px wide).
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 667,
    });
    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    });
  });

  it('reflows the stats grid from three desktop columns into a single mobile column', () => {
    // The `grid-cols-1 md:grid-cols-3` pair is the source of truth for the
    // "columns reflow into standard vertical flex lists" acceptance criterion.
    const { container } = renderClient();
    const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3') as HTMLElement;

    expect(statsGrid).not.toBeNull();
    expect(statsGrid).toHaveClass('grid-cols-1');
    expect(statsGrid).toHaveClass('md:grid-cols-3');

    // All three stat cards should still render as direct children stacked vertically.
    const statCards = statsGrid.querySelectorAll('.stat-item');
    expect(statCards).toHaveLength(3);
  });

  it('stacks the CTA action row vertically on mobile via flex-col before switching to flex-row on sm+', () => {
    // The CTA row uses `flex-col sm:flex-row` so mobile viewport shows
    // buttons in a vertical list instead of an overflowing horizontal row.
    const { container } = renderClient();
    const ctaRow = container.querySelector('.flex.flex-col.sm\\:flex-row') as HTMLElement;

    expect(ctaRow).not.toBeNull();
    expect(ctaRow).toHaveClass('flex-col');
    expect(ctaRow).toHaveClass('sm:flex-row');

    // Both CTA links should be present and still reachable at mobile widths.
    const repoLink = screen.getByRole('link', { name: /View Repository/i });
    const contribLink = screen.getByRole('link', { name: /Start Contributing/i });
    expect(repoLink).toBeInTheDocument();
    expect(contribLink).toBeInTheDocument();
  });

  it('does not emit absolute pixel widths on primary layout wrappers that would trigger horizontal scrollbars at 375px', () => {
    // Verifies the "no absolute widths causing horizontal scrollbars" requirement:
    // primary wrappers use relative constraints (max-w-*, min-h-*, viewport units).
    const { container } = renderClient();

    const rootWrapper = container.querySelector('.relative.min-h-screen') as HTMLElement;
    expect(rootWrapper).not.toBeNull();
    expect(rootWrapper).toHaveClass('overflow-hidden');

    const heroSection = container.querySelector('section.min-h-\\[90vh\\]') as HTMLElement;
    expect(heroSection).not.toBeNull();

    // Confirm none of the max-width containers hard-code a fixed pixel width
    // that exceeds a 375px viewport (they should all use rem-based max-w-* tokens).
    const boundedSections = container.querySelectorAll('.mx-auto.max-w-7xl');
    expect(boundedSections.length).toBeGreaterThan(0);
    boundedSections.forEach((section) => {
      const el = section as HTMLElement;
      // No inline pixel width should be applied by the component itself.
      expect(el.style.width).toBe('');
    });
  });

  it('hides the desktop custom cursor on mobile viewports via the hidden md:block responsive toggle', () => {
    // The custom cursor is a desktop-only ornament; on mobile viewports it must
    // gracefully step down using `hidden md:block` instead of blocking touch input.
    const { container } = renderClient();
    const cursor = container.querySelector('.pointer-events-none.z-\\[100\\]') as HTMLElement;

    expect(cursor).not.toBeNull();
    expect(cursor).toHaveClass('hidden');
    expect(cursor).toHaveClass('md:block');
    // Cursor must never intercept touch events even if it did render.
    expect(cursor).toHaveClass('pointer-events-none');
  });

  it('keeps mobile-specific toggle states responsive on primary CTAs (active:scale-95 tap feedback)', () => {
    // On touch devices, `hover:` states may never trigger, so the design relies
    // on `active:scale-95` to give tap feedback. This test guards that contract.
    renderClient();

    const exploreLink = screen.getByRole('link', { name: /Explore The Elite/i });
    const repoLink = screen.getByRole('link', { name: /View Repository/i });

    expect(exploreLink).toHaveClass('active:scale-95');
    expect(repoLink).toHaveClass('active:scale-95');

    // Section headings should also use the responsive `text-5xl md:text-7xl`
    // scale-down so titles don't overflow the 375px viewport.
    const vanguardHeading = screen.getByRole('heading', { name: /THE VANGUARD/i });
    expect(vanguardHeading).toHaveClass('text-5xl');
    expect(vanguardHeading).toHaveClass('md:text-7xl');
  });
});
