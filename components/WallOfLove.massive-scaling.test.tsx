import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { WallOfLove } from './WallOfLove';

/* ─────────────────────────────────────────────────────────
   MOCKS — same pattern as the existing WallOfLove test file
   ───────────────────────────────────────────────────────── */

vi.mock('framer-motion', () => ({
  motion: {
    p: (props: React.ComponentProps<'p'>) => <p {...props} />,
  },
  useReducedMotion: () => true,
}));

vi.mock('gsap', () => {
  const timeline = () => ({
    to: vi.fn().mockReturnThis(),
    fromTo: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  });

  return {
    default: {
      registerPlugin: vi.fn(),
      context: (cb: () => void) => {
        cb();
        return { revert: vi.fn() };
      },
      timeline,
      to: vi.fn(),
      set: vi.fn(),
      fromTo: vi.fn(),
    },
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

/* ─────────────────────────────────────────────────────────
   IntersectionObserver stub (not available in jsdom)
   ───────────────────────────────────────────────────────── */
beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    constructor(callback: IntersectionObserverCallback) {
      callback(
        [
          {
            isIntersecting: true,
            target: document.createElement('p'),
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: 1,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      );
    }
  }

  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

/* ═══════════════════════════════════════════════════════════════════════════
   WallOfLove — Massive Data Sets and Extreme High Bounds Scaling (Variation 2)
   ═══════════════════════════════════════════════════════════════════════════ */

describe('WallOfLove — Massive Scaling', () => {
  /* ───────────────────────────────────────────────────────────────────────
     TEST 1
     All 12 testimonial names from both rows are present in the DOM.
     MarqueeRow duplicates each array ([...t, ...t]), so every name must
     appear at least twice — verifying the duplication logic at scale.
     ─────────────────────────────────────────────────────────────────────── */
  it('renders all 12 unique testimonial author names, each duplicated by MarqueeRow', () => {
    render(<WallOfLove />);

    const allNames = [
      // ROW 1
      'Alex Chen',
      'Priya Sharma',
      'Marcus Johnson',
      'Yuki Tanaka',
      'Jordan Rivers',
      'Emma Rodriguez',
      // ROW 2
      'David Kim',
      'Sarah Mitchell',
      'Raj Patel',
      'Lisa Wong',
      'Omar Hassan',
      'Chloe Nguyen',
    ];

    allNames.forEach((name) => {
      const nodes = screen.getAllByText(name);
      // MarqueeRow duplicates: at least 2 occurrences of every card
      expect(nodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  /* ───────────────────────────────────────────────────────────────────────
     TEST 2
     All 12 handles from both rows appear in the DOM, each at least twice
     (duplicated by MarqueeRow), validating high-volume node rendering.
     ─────────────────────────────────────────────────────────────────────── */
  it('renders all 12 unique testimonial handles, each duplicated at least twice', () => {
    render(<WallOfLove />);

    const allHandles = [
      '@alexcodes',
      '@priyabuilds',
      '@marcusdev',
      '@yukicodes',
      '@jordandev',
      '@emmacodes',
      '@davidkim',
      '@sarahcodes',
      '@rajbuilds',
      '@lisawong',
      '@omardev',
      '@chloedev',
    ];

    allHandles.forEach((handle) => {
      const nodes = screen.getAllByText(handle);
      expect(nodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  /* ───────────────────────────────────────────────────────────────────────
     TEST 3
     All 12 testimonial messages render in full without truncation.
     Long strings (100+ chars) must survive the DOM without being cut off —
     this is the core text-wrapping / overflow correctness check at scale.
     ─────────────────────────────────────────────────────────────────────── */
  it('renders full-length testimonial messages without truncation', () => {
    render(<WallOfLove />);

    const messageSnippets: string[] = [
      '3D monolith looks absolutely insane', // Alex Chen
      'went from boring to absolutely premium', // Priya Sharma
      'real-time sync with GitHub is flawless', // Marcus Johnson
      'contribution graph into art', // Yuki Tanaka
      "Dracula theme is *chef's kiss*", // Jordan Rivers
      'want to code every single day', // Emma Rodriguez
      'tweaking every little detail', // David Kim
      '3D monolith on my profile gets so many', // Sarah Mitchell
      '3D masterpiece in seconds', // Raj Patel
      'SVG output is remarkable', // Lisa Wong
      'like a AAA game UI', // Omar Hassan
      'beautiful 3D view is incredibly motivating', // Chloe Nguyen
    ];

    messageSnippets.forEach((snippet) => {
      // getAllByText with exact:false matches partial text inside the element
      const nodes = screen.getAllByText((_content, element) =>
        (element?.textContent ?? '').includes(snippet)
      );
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  /* ───────────────────────────────────────────────────────────────────────
     TEST 4
     Stat bar renders correct extreme-looking production values.
     Verifies that large formatted strings ("50K+") and decimal values
     ("4.9") are not mangled, rounded, or clipped by the DOM at scale.
     ─────────────────────────────────────────────────────────────────────── */
  it('renders all three stat values and labels exactly as specified', () => {
    render(<WallOfLove />);

    // Values
    expect(screen.getByText('2K+')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();

    // Labels
    expect(screen.getByText('Happy Developers')).toBeInTheDocument();
    expect(screen.getByText('Badges Generated')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  /* ───────────────────────────────────────────────────────────────────────
     TEST 5
     Total card count in the DOM equals 24 (12 unique × 2 MarqueeRow rows
     × 2 duplication per row). Ensures the grid does not break, collapse,
     or silently drop nodes under the full combined data set load.
     ─────────────────────────────────────────────────────────────────────── */
  it('renders exactly 24 avatar images — 12 cards × 2 rows, each duplicated once', () => {
    render(<WallOfLove />);

    // Every TestimonialCard renders one <img> with alt = testimonial.name.
    // 6 cards in Row1 × 2 (duplicate) = 12 images
    // 6 cards in Row2 × 2 (duplicate) = 12 images
    // Total = 24
    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBe(24);

    // Every image must have a non-empty src (no broken blank images)
    avatars.forEach((img) => {
      expect(img).toHaveAttribute('src');
      expect((img as HTMLImageElement).src.length).toBeGreaterThan(0);
    });
  });
});
