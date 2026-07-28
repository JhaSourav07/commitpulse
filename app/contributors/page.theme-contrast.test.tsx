/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ContributorsPage from './page';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props || {};
    return <img {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('gsap', () => {
  const tween = { kill: vi.fn() };
  const mockGsap = {
    registerPlugin: vi.fn(),
    to: vi.fn().mockReturnValue(tween),
    fromTo: vi.fn().mockReturnValue(tween),
    set: vi.fn(),
    context: vi.fn((callback: any) => {
      if (typeof callback === 'function') {
        callback();
      }
      return { revert: vi.fn() };
    }),
  };
  return { default: mockGsap, gsap: mockGsap };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: vi.fn(() => []),
  },
}));

vi.mock('framer-motion', () => {
  return {
    motion: {
      div: 'div',
      span: 'span',
      p: 'p',
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      section: 'section',
      a: 'a',
      button: 'button',
      img: 'img',
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useMotionValue: (initial: any) => {
      const [val, setVal] = React.useState(initial);
      return {
        current: val,
        set: (v: any) => setVal(v),
      };
    },
    useSpring: (value: any) => value,
    useTransform: (value: any, fn: any) => fn(value.current ?? value),
  };
});

describe('ContributorsPage - Theme Contrast & Visual Cohesion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // Mock fetch for default empty or small contributor array to prevent real fetches
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 1,
            login: 'developer-1',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
            contributions: 100,
            html_url: 'https://github.com/developer-1',
          },
        ],
      })
    ) as any;

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (callback: FrameRequestCallback) =>
        setTimeout(callback, 0) as unknown as number;
    }
  });

  // --- Test Case 1 ---
  it('retains theme contrast utility classes in the layout container structure', async () => {
    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    const pageContainer = screen.getByRole('heading', { name: /THE COLLECTIVE/i }).closest('div');
    expect(pageContainer).toBeTruthy();

    // Assert backdrop, selection, and base dark/light classes are present
    const layoutWrapper = screen
      .getByRole('heading', { name: /THE VANGUARD/i })
      .closest('.min-h-screen');
    expect(layoutWrapper).toBeTruthy();
    expect(layoutWrapper?.className).toContain('bg-white');
    expect(layoutWrapper?.className).toContain('dark:bg-[#050505]');
    expect(layoutWrapper?.className).toContain('text-black');
    expect(layoutWrapper?.className).toContain('dark:text-white');
  });

  // --- Test Case 2 ---
  it('applies text colors that adapt to system preferences on primary headings', async () => {
    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // The h1 in header contains gradients for light/dark visual contrast
    const headingBlock = screen.getByRole('heading', { name: /BUILDING/i });
    expect(headingBlock).toBeTruthy();

    const lightThemeTextSpan = screen.getByText('BUILDING');
    expect(lightThemeTextSpan?.className).toContain('from-black');
    expect(lightThemeTextSpan?.className).toContain('to-black/60');
    expect(lightThemeTextSpan?.className).toContain('dark:from-white');
    expect(lightThemeTextSpan?.className).toContain('dark:to-white/40');
  });

  // --- Test Case 3 ---
  it('verifies contrast compliance classes on subtitles and labels', async () => {
    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // Assert that Vanguard description class provides readable contrast
    const vanguardSubtitle = screen.getByText(
      /The highest impact contributors pushing the boundaries/i
    );
    expect(vanguardSubtitle?.className).toContain('text-zinc-600');
    expect(vanguardSubtitle?.className).toContain('dark:text-zinc-500');

    // Assert Collective description class provides readable contrast
    const collectiveSubtitle = screen.getByText(/Every single mind that has contributed code/i);
    expect(collectiveSubtitle?.className).toContain('text-zinc-600');
    expect(collectiveSubtitle?.className).toContain('dark:text-zinc-500');
  });

  // --- Test Case 4 ---
  it('asserts proper border contrast classes are present on background panels', async () => {
    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // The CTA section containing View Repository buttons uses border-black/10 or border-white/10
    const ctaHeader = screen.getByRole('heading', { name: /READY TO BUILD\?/i });
    const ctaWrapper = ctaHeader.closest('div');
    expect(ctaWrapper).toBeTruthy();
    expect(ctaWrapper?.className).toContain('border-black/10');
    expect(ctaWrapper?.className).toContain('dark:border-white/10');
    expect(ctaWrapper?.className).toContain('bg-black/[0.02]');
    expect(ctaWrapper?.className).toContain('dark:bg-white/[0.02]');
  });

  // --- Test Case 5 ---
  it('ensures background glow overlays do not intercept click events on foreground content', async () => {
    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // Ambient glow overlay divs must be wrapped inside a pointer-events-none container (or have it directly)
    const parentWrapper = screen
      .getByRole('heading', { name: /THE VANGUARD/i })
      .closest('.min-h-screen');
    expect(parentWrapper).toBeTruthy();

    const overlayDivs = parentWrapper?.querySelectorAll('.blur-\\[150px\\]');
    expect(overlayDivs).toBeTruthy();
    expect(overlayDivs?.length).toBeGreaterThan(0);

    overlayDivs?.forEach((div) => {
      const hasPointerEventsNone =
        div.className.includes('pointer-events-none') ||
        div.parentElement?.className.includes('pointer-events-none');
      expect(hasPointerEventsNone).toBe(true);
    });
  });
});
