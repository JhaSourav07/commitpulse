/// <reference types="react/jsx-runtime" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CherryBlossom, { type Petal } from './CherryBlossom';

// Stub framer-motion so animations are synchronous and DOM-inspectable.
// Without this mock the motion.div elements never appear in the jsdom tree
// because framer-motion defers them to a browser animation frame.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      initial,
      animate,
      transition,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: object;
      animate?: object;
      transition?: object;
    }) => (
      <div
        data-testid="falling-petal"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        className={className}
        {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    ),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a synthetic Petal fixture that sits at extreme high-bound values.
 * This mirrors the shape produced by generatePetals() in CherryBlossom.tsx
 * so assertions can reference exact field semantics.
 */
function buildExtremePetal(id: number): Petal {
  return {
    id,
    x: 99.99, // rightmost possible start position (%)
    y: -39.99, // highest above-viewport start position (%)
    scale: 1.0, // maximum scale value
    duration: 25, // maximum fall duration (seconds)
    delay: 20, // maximum start delay (seconds)
    rotation: 359.99, // near-full rotation
    rotationSpeed: 180, // fast clockwise spin
    sway: 30, // maximum horizontal sway amplitude
  };
}

/** How many petals CherryBlossom always produces. */
const PETAL_COUNT = 25;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CherryBlossom — Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1 — All 25 petals render under extreme property values
  // -------------------------------------------------------------------------
  it('renders all 25 petals when every petal property is at its maximum allowed bound', () => {
    /**
     * WHY: generatePetals() samples Math.random() for each property. If any
     * property at its ceiling (e.g. sway = 30, scale = 1.0, delay = 20s)
     * caused the component to skip, hide, or crash a petal node, this test
     * catches it. We pin Math.random to 1 to force every property to its
     * practical upper bound simultaneously.
     */
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(1);

    const { getAllByTestId } = render(<CherryBlossom />);

    const petals = getAllByTestId('falling-petal');
    expect(petals).toHaveLength(PETAL_COUNT);

    mockRandom.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Test 2 — SVG coordinate integrity at extreme scale values
  // -------------------------------------------------------------------------
  it('keeps SVG petal path and viewBox intact when scale is at the extreme upper bound', () => {
    /**
     * WHY: At scale=1.0 (the maximum), the rendered SVG petal element must
     * still carry its correct viewBox and path data. A scaling bug could
     * silently zero-out or corrupt coordinate attributes, making petals
     * invisible without throwing an error.
     */
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const { container } = render(<CherryBlossom />);

    // Every petal SVG must retain its 30×30 viewBox at maximum scale
    const petalSvgs = container.querySelectorAll('[data-testid="falling-petal"] svg');
    expect(petalSvgs.length).toBe(PETAL_COUNT);

    petalSvgs.forEach((svg) => {
      expect(svg).toHaveAttribute('viewBox', '0 0 30 30');
      expect(svg).toHaveAttribute('width', '15');
      expect(svg).toHaveAttribute('height', '15');

      // The petal path must still exist and carry coordinate data
      const path = svg.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path?.getAttribute('d')).toMatch(/^M15,0/); // starts at apex
    });
  });

  // -------------------------------------------------------------------------
  // Test 3 — Animation keyframe arrays stay structurally sound at high bounds
  // -------------------------------------------------------------------------
  it('encodes well-formed animate keyframe arrays on every petal at extreme sway and duration bounds', () => {
    /**
     * WHY: The component passes x/y/opacity arrays to motion.div's animate
     * prop. At maximum sway (30vw) the x keyframe array should contain exactly
     * 4 entries spanning left and right of the start position — never NaN,
     * never undefined. Malformed keyframes would cause silent visual glitches.
     */
    vi.spyOn(Math, 'random').mockReturnValue(1);

    render(<CherryBlossom />);

    const petals = screen.getAllByTestId('falling-petal');
    expect(petals.length).toBe(PETAL_COUNT);

    petals.forEach((petal) => {
      const rawAnimate = petal.getAttribute('data-animate');
      expect(rawAnimate).not.toBeNull();

      const animate = JSON.parse(rawAnimate!);

      // x must be an array of 4 viewport-relative strings
      expect(Array.isArray(animate.x)).toBe(true);
      expect(animate.x).toHaveLength(4);
      animate.x.forEach((val: unknown) => {
        expect(typeof val).toBe('string');
        expect(val as string).toMatch(/vw$/);
        // No NaN values sneaking in
        const numeric = parseFloat((val as string).replace('vw', ''));
        expect(Number.isFinite(numeric)).toBe(true);
      });

      // y must be an array of 4 viewport-relative strings spanning -10vh → 110vh
      expect(Array.isArray(animate.y)).toBe(true);
      expect(animate.y).toHaveLength(4);
      expect(animate.y[0]).toBe('-10vh');
      expect(animate.y[animate.y.length - 1]).toBe('110vh');

      // opacity must be an array of 4 numeric values
      expect(Array.isArray(animate.opacity)).toBe(true);
      expect(animate.opacity).toHaveLength(4);
      animate.opacity.forEach((val: unknown) => {
        expect(typeof val).toBe('number');
        expect(val as number).toBeGreaterThanOrEqual(0);
        expect(val as number).toBeLessThanOrEqual(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Test 4 — Bulk re-render stress: layout tree stays stable across 100 cycles
  // -------------------------------------------------------------------------
  it('sustains a consistent DOM node count across 100 consecutive re-renders without degradation', () => {
    /**
     * WHY: Some animation libraries (or React reconciliation bugs) can
     * accumulate phantom DOM nodes on repeated re-renders. At high re-render
     * counts this can saturate memory and break the layout tree. We assert
     * that the SVG and petal counts remain exactly stable every cycle.
     *
     * 100 re-renders with framer-motion mocked is fast (< 500 ms) but
     * meaningfully stresses the reconciler path.
     */
    const RE_RENDER_CYCLES = 100;
    const { container, rerender } = render(<CherryBlossom />);

    const svgCountBaseline = container.querySelectorAll('svg').length;
    // 2 branch SVGs + 25 petal SVGs = 27
    expect(svgCountBaseline).toBe(27);

    for (let cycle = 0; cycle < RE_RENDER_CYCLES; cycle++) {
      rerender(<CherryBlossom />);

      // Node count must never drift — not up (leak) nor down (loss)
      const svgCount = container.querySelectorAll('svg').length;
      expect(svgCount).toBe(svgCountBaseline);
    }

    // Final petal count must still be exactly 25 after all cycles
    const finalPetals = screen.getAllByTestId('falling-petal');
    expect(finalPetals).toHaveLength(PETAL_COUNT);
  });

  // -------------------------------------------------------------------------
  // Test 5 — Transition config integrity at maximum duration and delay bounds
  // -------------------------------------------------------------------------
  it('encodes correct transition config with finite repeat:Infinity at maximum duration and delay bounds', () => {
    /**
     * WHY: At duration=25s and delay=20s (both ceiling values) the transition
     * object passed to motion.div must still carry repeat:Infinity and
     * ease:'linear'. If either field is missing or corrupted the petal falls
     * exactly once and then freezes — a subtle, hard-to-spot regression.
     * We verify these fields are intact for every petal under ceiling values.
     */
    vi.spyOn(Math, 'random').mockReturnValue(1);

    render(<CherryBlossom />);

    const petals = screen.getAllByTestId('falling-petal');
    expect(petals).toHaveLength(PETAL_COUNT);

    petals.forEach((petal) => {
      const rawTransition = petal.getAttribute('data-transition');
      expect(rawTransition).not.toBeNull();

      const transition = JSON.parse(rawTransition!);

      // Duration must be a finite positive number (10 + rand*15 → max 25)
      expect(typeof transition.duration).toBe('number');
      expect(Number.isFinite(transition.duration)).toBe(true);
      expect(transition.duration).toBeGreaterThan(0);
      expect(transition.duration).toBeLessThanOrEqual(25);

      // Delay must be a finite non-negative number (rand*20 → max 20)
      expect(typeof transition.delay).toBe('number');
      expect(Number.isFinite(transition.delay)).toBe(true);
      expect(transition.delay).toBeGreaterThanOrEqual(0);
      expect(transition.delay).toBeLessThanOrEqual(20);

      // repeat must be Infinity — JSON serialises Infinity as null
      // because JSON.stringify(Infinity) === 'null'
      expect(transition.repeat).toBeNull();

      expect(transition.ease).toBe('linear');
    });
  });
});
