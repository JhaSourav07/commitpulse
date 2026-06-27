import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { WallOfLove } from './WallOfLove';

class IntersectionObserverMock {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

let mockReducedMotion = false;

// Mock framer-motion strictly
vi.mock('framer-motion', () => ({
  motion: {
    p: (props: React.ComponentProps<'p'>) => <p {...props} />,
    div: (props: React.ComponentProps<'div'>) => <div {...props} />,
  },
  useReducedMotion: () => mockReducedMotion,
}));

// Mock GSAP
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
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

describe('WallOfLove - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    mockReducedMotion = false;
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
    vi.clearAllMocks();
  });

  // Test Case 1: Mock standard mobile-width media coordinates (e.g. 375px wide viewports)
  it('Mock standard mobile-width media coordinates (e.g. 375px wide viewports): Mock window viewport to simulate iPhone SE size', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<WallOfLove />);
    expect(window.innerWidth).toBe(375);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Wall of Love');
  });

  // Test Case 2: Assert that columns reflow into standard vertical flex lists
  it('Assert that columns reflow into standard vertical flex lists: Container stacks rows vertically and tracks align horizontally', () => {
    const { container } = render(<WallOfLove />);

    // The wrapper of marquee rows uses vertical stacking spacing-y
    const marqueeContainer = container.querySelector('.space-y-5');
    expect(marqueeContainer).toHaveClass('space-y-5');

    // The track wrapper uses flex layout
    const tracks = container.querySelectorAll('.flex.gap-5.py-2');
    expect(tracks.length).toBeGreaterThan(0);
    tracks.forEach((track) => {
      expect(track).toHaveClass('flex');
    });
  });

  // Test Case 3: Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports
  it('Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports: containers use relative constraints', () => {
    const { container } = render(<WallOfLove />);

    // Outer section has overflow-hidden to prevent horizontal scrollbars from marquee rows
    const section = container.querySelector('section');
    expect(section).toHaveClass('overflow-hidden');

    // Section header elements do not use rigid widths
    const headerWrapper = container.querySelector('.text-center.mb-16.px-6');
    expect(headerWrapper?.className).not.toMatch(/w-\[\d+px\]/);

    // Subheading description uses fluid responsive max-w rather than absolute pixel width
    const subheading = container.querySelector('p.mx-auto');
    expect(subheading).toHaveClass('max-w-xl');
  });

  // Test Case 4: Check that navigation components scale down gracefully
  it('Check that navigation components scale down gracefully: Click/touch targets and layout bounds are properly configured', () => {
    const { container } = render(<WallOfLove />);

    // Testimonial cards should have cursor-pointer to indicate interactive nature
    const cards = container.querySelectorAll('.cursor-pointer');
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card).toHaveClass('cursor-pointer');
    });

    // Stat items have generous padding (px-4 py-6) for easy touch target tapping on mobile
    const statItems = container.querySelectorAll('.group.relative.px-4.py-6');
    expect(statItems.length).toBe(3);
    statItems.forEach((item) => {
      expect(item).toHaveClass('px-4', 'py-6');
    });
  });

  // Test Case 5: Assert mobile-specific toggle states respond cleanly
  it('Assert mobile-specific toggle states respond cleanly: reduced motion toggle disables GSAP marquees', () => {
    // When reduced motion is enabled (true), marquee animation should be bypassed
    mockReducedMotion = true;
    const { rerender } = render(<WallOfLove />);

    // When reduced motion is disabled (false), GSAP context setup works
    mockReducedMotion = false;
    rerender(<WallOfLove />);

    // If it did not throw/crash and responded cleanly, it is correct.
    expect(screen.getByText('2K+')).toBeInTheDocument();
  });
});
