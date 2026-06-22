/* ==========================================================================
 * COMPONENT LAYER — RESPONSIVE BREAKPOINTS & VIEWPORT LAYOUT ADAPTATION
 * PopularPinnnedRepos — response-breakpoints.test.tsx
 * ========================================================================== */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PopularRepos } from './PopularPinnnedRepos';

// ─── Mock lucide-react ────────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className, ...props }: React.SVGProps<SVGSVGElement>) =>
    React.createElement('svg', { 'data-testid': 'chevron-icon', className, ...props }),
  Star: ({ className, ...props }: React.SVGProps<SVGSVGElement>) =>
    React.createElement('svg', { 'data-testid': 'star-icon', className, ...props }),
}));

// ─── Viewport simulation ──────────────────────────────────────────────────────

const BREAKPOINTS = {
  mobileXS: 320, // iPhone SE — smallest supported viewport
  mobileSM: 375, // iPhone 14
  mobileMD: 414, // iPhone 14 Plus
  tabletSM: 640, // Tailwind sm breakpoint
  tabletMD: 768, // Tailwind md breakpoint
  tabletLG: 1024, // Tailwind lg breakpoint
  desktopXL: 1280, // Tailwind xl breakpoint
  desktop2XL: 1536, // Tailwind 2xl breakpoint
  ultrawide: 2560, // 4K / ultrawide monitor
} as const;

function setViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

interface RepoOverrides {
  name?: string;
  description?: string | null;
  stargazerCount?: number;
  forkCount?: number;
  url?: string;
  primaryLanguage?: { name: string; color: string } | null;
}

function makeRepo(overrides: RepoOverrides = {}) {
  return {
    name: 'test-repo',
    description: 'A test repository',
    stargazerCount: 10,
    forkCount: 2,
    url: 'https://github.com/user/test-repo',
    primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    ...overrides,
  };
}

function makeRepos(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) =>
    makeRepo({
      name: `${prefix}-${i + 1}`,
      url: `https://github.com/user/${prefix}-${i + 1}`,
    })
  );
}

const popularRepos = makeRepos(3, 'popular');
const pinnedRepos = makeRepos(2, 'pinned');
const starredRepos = makeRepos(3, 'starred');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getHeaderTitle = () => screen.getByTestId('repo-header-title');
const getToggleBtn = () => screen.queryByRole('button', { name: /popular|pinned|starred/i });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PopularRepos — Responsive Breakpoints & Viewport Layout Adaptation', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  // ===========================================================================
  // SECTION 1 — MOUNTS WITHOUT CRASH ACROSS ALL BREAKPOINTS
  // ===========================================================================

  describe('Section 1 — mounts without crashing at every standard breakpoint', () => {
    it('renders correctly at mobileXS (320px)', () => {
      setViewport(BREAKPOINTS.mobileXS);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at mobileSM (375px)', () => {
      setViewport(BREAKPOINTS.mobileSM);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at mobileMD (414px)', () => {
      setViewport(BREAKPOINTS.mobileMD);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at tabletSM (640px)', () => {
      setViewport(BREAKPOINTS.tabletSM);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at tabletMD (768px)', () => {
      setViewport(BREAKPOINTS.tabletMD);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at tabletLG (1024px)', () => {
      setViewport(BREAKPOINTS.tabletLG);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at desktopXL (1280px)', () => {
      setViewport(BREAKPOINTS.desktopXL);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at desktop2XL (1536px)', () => {
      setViewport(BREAKPOINTS.desktop2XL);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('renders correctly at ultrawide (2560px)', () => {
      setViewport(BREAKPOINTS.ultrawide);
      const { container } = render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('returns null at every breakpoint when all lists are empty', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { container, unmount } = render(
          <PopularRepos popularRepos={[]} pinnedRepos={[]} starredRepos={[]} />
        );
        expect(container.firstChild).toBeNull();
        unmount();
      });
    });
  });

  // ===========================================================================
  // SECTION 2 — ROOT CONTAINER LAYOUT CLASSES
  // ===========================================================================

  describe('Section 2 — root container layout classes hold across viewports', () => {
    it('outer wrapper carries w-full to fill narrow mobile screens', () => {
      setViewport(BREAKPOINTS.mobileXS);
      const { container } = render(<PopularRepos popularRepos={popularRepos} />);
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('w-full');
    });

    it('outer wrapper carries max-w-7xl to cap width on ultrawide screens', () => {
      setViewport(BREAKPOINTS.ultrawide);
      const { container } = render(<PopularRepos popularRepos={popularRepos} />);
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('max-w-7xl');
    });

    it('outer wrapper carries mx-auto for horizontal centring at every breakpoint', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { container, unmount } = render(<PopularRepos popularRepos={popularRepos} />);
        const root = container.firstChild as HTMLElement;
        expect(root.className).toContain('mx-auto');
        unmount();
      });
    });

    it('inner card panel carries rounded-xl border shadow-sm at mobileXS', () => {
      setViewport(BREAKPOINTS.mobileXS);
      const { container } = render(<PopularRepos popularRepos={popularRepos} />);
      const panel = (container.firstChild as HTMLElement).firstChild as HTMLElement;
      expect(panel.className).toContain('rounded-xl');
      expect(panel.className).toContain('border');
      expect(panel.className).toContain('shadow-sm');
    });

    it('inner card panel carries p-5 padding at every breakpoint', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { container, unmount } = render(<PopularRepos popularRepos={popularRepos} />);
        const panel = (container.firstChild as HTMLElement).firstChild as HTMLElement;
        expect(panel.className).toContain('p-5');
        unmount();
      });
    });
  });

  // ===========================================================================
  // SECTION 3 — HEADER ROW LAYOUT
  // ===========================================================================

  describe('Section 3 — header row layout properties', () => {
    it('header row uses flex justify-between at mobileXS', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      const headerRow = getHeaderTitle().closest('div[class*="justify-between"]');
      expect(headerRow).not.toBeNull();
    });

    it('header title is visible at every breakpoint', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { unmount } = render(<PopularRepos popularRepos={popularRepos} />);
        expect(getHeaderTitle()).toBeDefined();
        unmount();
      });
    });

    it('header title reads "Popular Repositories" by default at every breakpoint', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { unmount } = render(<PopularRepos popularRepos={popularRepos} />);
        expect(getHeaderTitle().textContent).toBe('Popular Repositories');
        unmount();
      });
    });

    it('header icon container is flex-shrink-0 to avoid icon squishing on narrow screens', () => {
      setViewport(BREAKPOINTS.mobileXS);
      const { container } = render(<PopularRepos popularRepos={popularRepos} />);
      const shrinkDiv = container.querySelector('.flex-shrink-0');
      expect(shrinkDiv).not.toBeNull();
    });
  });

  // ===========================================================================
  // SECTION 4 — DROPDOWN TOGGLE PRESENCE & POSITIONING
  // ===========================================================================

  describe('Section 4 — dropdown toggle presence and positioning', () => {
    it('dropdown button is present at mobileXS when two lists have data', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      expect(getToggleBtn()).not.toBeNull();
    });

    it('dropdown button is present at tabletMD when two lists have data', () => {
      setViewport(BREAKPOINTS.tabletMD);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      expect(getToggleBtn()).not.toBeNull();
    });

    it('dropdown button is present at ultrawide when two lists have data', () => {
      setViewport(BREAKPOINTS.ultrawide);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      expect(getToggleBtn()).not.toBeNull();
    });

    it('dropdown wrapper uses relative positioning at every breakpoint', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { unmount } = render(
          <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
        );
        fireEvent.click(getToggleBtn()!);
        const listbox = screen.getByRole('listbox');
        // listbox parent should be relative
        expect(listbox.parentElement!.className).toContain('relative');
        unmount();
      });
    });

    it('dropdown listbox uses absolute positioning to avoid pushing layout', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      fireEvent.click(getToggleBtn()!);
      expect(screen.getByRole('listbox').className).toContain('absolute');
    });

    it('dropdown listbox is right-aligned (right-0) to avoid overflow on narrow screens', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      fireEvent.click(getToggleBtn()!);
      expect(screen.getByRole('listbox').className).toContain('right-0');
    });

    it('dropdown listbox has z-10 to float above card content at all breakpoints', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { unmount } = render(
          <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
        );
        fireEvent.click(getToggleBtn()!);
        expect(screen.getByRole('listbox').className).toContain('z-10');
        unmount();
      });
    });

    it('dropdown listbox has overflow-hidden to clip rounded corners on all breakpoints', () => {
      setViewport(BREAKPOINTS.mobileSM);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      fireEvent.click(getToggleBtn()!);
      expect(screen.getByRole('listbox').className).toContain('overflow-hidden');
    });

    it('dropdown opens and closes at mobileXS without layout issues', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      fireEvent.click(getToggleBtn()!);
      expect(screen.getByRole('listbox')).toBeDefined();
      fireEvent.click(getToggleBtn()!);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('dropdown opens and closes at ultrawide without layout issues', () => {
      setViewport(BREAKPOINTS.ultrawide);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      fireEvent.click(getToggleBtn()!);
      expect(screen.getByRole('listbox')).toBeDefined();
      fireEvent.click(getToggleBtn()!);
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  // ===========================================================================
  // SECTION 5 — REPO CARD OVERFLOW PROTECTION
  // ===========================================================================

  describe('Section 5 — repo card overflow protection classes', () => {
    it('each card carries overflow-hidden to prevent blowout on narrow screens', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} />);
      screen.getAllByRole('link').forEach((card) => {
        expect(card.className).toContain('overflow-hidden');
      });
    });

    it('each card carries min-w-0 so flex children can shrink below content size', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} />);
      screen.getAllByRole('link').forEach((card) => {
        expect(card.className).toContain('min-w-0');
      });
    });

    it('each card carries w-full to fill available column width', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { unmount } = render(<PopularRepos popularRepos={popularRepos} />);
        screen.getAllByRole('link').forEach((card) => {
          expect(card.className).toContain('w-full');
        });
        unmount();
      });
    });

    it('each card carries h-[100px] fixed height to maintain grid rhythm', () => {
      Object.values(BREAKPOINTS).forEach((width) => {
        setViewport(width);
        const { unmount } = render(<PopularRepos popularRepos={popularRepos} />);
        screen.getAllByRole('link').forEach((card) => {
          expect(card.className).toContain('h-[100px]');
        });
        unmount();
      });
    });

    it('repo name h4 carries truncate class to prevent text overflow on small screens', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} />);
      document.querySelectorAll('h4').forEach((title) => {
        expect(title.className).toContain('truncate');
      });
    });

    it('repo description carries line-clamp-2 to cap vertical overflow', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} />);
      const clampedParagraphs = document.querySelectorAll('p.line-clamp-2');
      expect(clampedParagraphs.length).toBeGreaterThan(0);
    });

    it('language name span carries truncate to prevent label overflow on narrow cards', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(
        <PopularRepos
          popularRepos={[makeRepo({ primaryLanguage: { name: 'TypeScript', color: '#3178c6' } })]}
        />
      );
      const truncatedSpans = document.querySelectorAll('span.truncate');
      expect(truncatedSpans.length).toBeGreaterThan(0);
    });

    it('language dot is flex-shrink-0 to never get squished on narrow screens', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(
        <PopularRepos
          popularRepos={[makeRepo({ primaryLanguage: { name: 'Go', color: '#00ADD8' } })]}
        />
      );
      const dot = document.querySelector('.flex-shrink-0.rounded-full');
      expect(dot).not.toBeNull();
    });
  });

  // ===========================================================================
  // SECTION 6 — CARD LIST STACKING
  // ===========================================================================

  describe('Section 6 — card list stacks vertically at all breakpoints', () => {
    it('card list container uses flex-col for vertical stacking at mobileXS', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} />);
      const list = document.querySelector('.flex.flex-col');
      expect(list).not.toBeNull();
    });

    it('card list container uses flex-col for vertical stacking at ultrawide', () => {
      setViewport(BREAKPOINTS.ultrawide);
      render(<PopularRepos popularRepos={popularRepos} />);
      const list = document.querySelector('.flex.flex-col');
      expect(list).not.toBeNull();
    });

    it('renders exactly 3 cards at mobileXS regardless of list size', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={makeRepos(10, 'pop')} />);
      expect(screen.getAllByRole('link')).toHaveLength(3);
    });

    it('renders exactly 3 cards at desktopXL regardless of list size', () => {
      setViewport(BREAKPOINTS.desktopXL);
      render(<PopularRepos popularRepos={makeRepos(10, 'pop')} />);
      expect(screen.getAllByRole('link')).toHaveLength(3);
    });

    it('renders exactly 3 cards at ultrawide regardless of list size', () => {
      setViewport(BREAKPOINTS.ultrawide);
      render(<PopularRepos popularRepos={makeRepos(10, 'pop')} />);
      expect(screen.getAllByRole('link')).toHaveLength(3);
    });
  });

  // ===========================================================================
  // SECTION 7 — VIEW SWITCHING ACROSS BREAKPOINTS
  // ===========================================================================

  describe('Section 7 — view switching works correctly across breakpoints', () => {
    it('switches to Pinned and shows correct repos at mobileXS', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
      expect(getHeaderTitle().textContent).toBe('Pinned Repositories');
      expect(screen.getByText('pinned-1')).toBeDefined();
    });

    it('switches to Starred and shows star icon at tabletMD', () => {
      setViewport(BREAKPOINTS.tabletMD);
      render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
      expect(screen.getByTestId('star-icon')).toBeDefined();
      expect(getHeaderTitle().textContent).toBe('Starred Repositories');
    });

    it('switches to Starred at desktopXL and shows correct repos', () => {
      setViewport(BREAKPOINTS.desktopXL);
      render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
      expect(screen.getByText('starred-1')).toBeDefined();
    });

    it('selected view state persists after a viewport resize event', () => {
      setViewport(BREAKPOINTS.mobileSM);
      render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );
      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
      expect(getHeaderTitle().textContent).toBe('Pinned Repositories');

      // Simulate viewport expanding to desktop
      setViewport(BREAKPOINTS.desktopXL);

      // React state is in-memory — unaffected by the DOM resize event
      expect(getHeaderTitle().textContent).toBe('Pinned Repositories');
    });

    it('full cycle Popular → Pinned → Starred → Popular works at mobileXS', () => {
      setViewport(BREAKPOINTS.mobileXS);
      render(
        <PopularRepos
          popularRepos={popularRepos}
          pinnedRepos={pinnedRepos}
          starredRepos={starredRepos}
        />
      );

      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
      expect(getHeaderTitle().textContent).toBe('Pinned Repositories');

      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
      expect(getHeaderTitle().textContent).toBe('Starred Repositories');

      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: 'Popular' }));
      expect(getHeaderTitle().textContent).toBe('Popular Repositories');
    });
  });
});
