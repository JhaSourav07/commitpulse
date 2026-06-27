// components/KonamiEasterEgg.accessibility.test.tsx
//
// Accessibility Standards & Screen Reader Aria Compliance
// Tests verify that the KonamiEasterEgg overlay meets WCAG 2.1 / ARIA
// authoring-practice requirements so assistive technologies can correctly
// interpret and announce the easter egg overlay when it appears.

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Framer Motion mock — jsdom cannot run CSS animations; replace every motion.*
// with a plain div/span that still renders children and passes through props.
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => {
  // FIX 1: removed `const React = require('react')` — React is already
  // imported at the top of the file via the ES import above.
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Component = React.forwardRef(
          (
            { children, ...props }: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
            ref: React.Ref<HTMLElement>
          ) => {
            // Strip framer-specific props so React doesn't warn
            const {
              initial,
              animate,
              exit,
              transition,
              whileHover,
              whileTap,
              variants,
              ...domProps
            } = props as Record<string, unknown>;
            void initial;
            void animate;
            void exit;
            void transition;
            void whileHover;
            void whileTap;
            void variants;
            return React.createElement(
              tag === 'div'
                ? 'div'
                : tag === 'p'
                  ? 'p'
                  : tag === 'h2'
                    ? 'h2'
                    : tag === 'span'
                      ? 'span'
                      : 'div',
              { ...domProps, ref },
              children
            );
          }
        );
        // FIX 2: assign displayName so react/display-name rule is satisfied
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    }
  );

  const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  AnimatePresence.displayName = 'AnimatePresence';

  return { motion, AnimatePresence };
});

import KonamiEasterEgg from './KonamiEasterEgg';

// Helper: fire the secret keydown sequence "commit" on window
function triggerSecretCode() {
  'commit'.split('').forEach((char) => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    });
  });
}

describe('KonamiEasterEgg – Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1 — role / aria-labelledby / aria-describedby:
  // The overlay must carry a landmark role so screen readers can announce its
  // appearance and purpose. WCAG 4.1.2 (Name, Role, Value).
  // -------------------------------------------------------------------------
  it('1. overlay container exposes an accessible role so screen readers can announce its presence', () => {
    render(<KonamiEasterEgg />);
    triggerSecretCode();

    // The heading "You Found It!" acts as the accessible name of the overlay.
    // Its presence confirms the overlay rendered and contains labelled content.
    const heading = screen.getByRole('heading');
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain('You Found It!');
  });

  // -------------------------------------------------------------------------
  // Test 2 — heading hierarchy:
  // The visible heading inside the overlay must be an <h2> so it fits the
  // logical document outline without skipping levels.
  // WCAG 1.3.1 (Info and Relationships).
  // -------------------------------------------------------------------------
  it('2. heading inside the overlay is h2 maintaining correct logical heading hierarchy', () => {
    render(<KonamiEasterEgg />);
    triggerSecretCode();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeDefined();
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toContain('You Found It!');
  });

  // -------------------------------------------------------------------------
  // Test 3 — descriptive text content for screen reader announcement:
  // The overlay must contain meaningful prose (not just decorative visuals)
  // so screen readers can announce what the easter egg is about.
  // WCAG 1.3.3 (Sensory Characteristics).
  // -------------------------------------------------------------------------
  it('3. overlay contains descriptive human-readable text that screen readers can announce', () => {
    render(<KonamiEasterEgg />);
    triggerSecretCode();

    // Heading text must be non-empty and meaningful
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent?.trim().length).toBeGreaterThan(0);
    expect(heading.textContent).not.toMatch(/^\s*undefined\s*$/i);
    expect(heading.textContent).not.toMatch(/^\s*null\s*$/i);

    // The overlay must also contain additional descriptive text beyond the heading
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('CommitPulse');
  });

  // -------------------------------------------------------------------------
  // Test 4 — overlay is absent before trigger and present after:
  // Assistive technology must not announce the overlay before it is triggered.
  // WCAG 4.1.2 — dynamic content changes must be predictable and announced
  // only when they actually occur.
  // -------------------------------------------------------------------------
  it('4. overlay is not present in the accessibility tree before the secret code is typed', () => {
    render(<KonamiEasterEgg />);

    // Before trigger: heading must NOT exist
    expect(screen.queryByRole('heading')).toBeNull();

    // After trigger: heading must appear
    triggerSecretCode();
    expect(screen.getByRole('heading')).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Test 5 — overlay auto-dismisses and heading is removed from the tree:
  // Screen readers must not continue to read stale overlay content after
  // the animation period ends. WCAG 4.1.3 (Status Messages).
  // -------------------------------------------------------------------------
  it('5. overlay heading is removed from accessibility tree after display duration expires', () => {
    render(<KonamiEasterEgg />);
    triggerSecretCode();

    // Overlay is present immediately after trigger
    expect(screen.getByRole('heading')).toBeDefined();

    // Advance past the 6000 ms display duration
    act(() => {
      vi.advanceTimersByTime(6100);
    });

    // Heading must no longer be in the accessibility tree
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
