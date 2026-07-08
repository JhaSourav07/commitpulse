// components/KonamiEasterEgg.error-resilience.test.tsx
//
// error-resilience (Variation 6) — Hydration Stability, Exception Safety & Error Fallbacks.
//
// NOTE ON SCOPE: KonamiEasterEgg is a pure client component — a global keydown
// listener that reveals an animated overlay when the secret code is typed. It has
// no data/service/telemetry layer and no error-boundary UI, so the issue's
// "database connectivity / dev-telemetry / recovery panel" language is mapped onto
// the component's genuine resilience surface: it must render nothing (and therefore
// hydrate cleanly) until triggered, survive unexpected/guarded keyboard input without
// throwing, tolerate degenerate props via its documented fallbacks, tear its listener
// down safely on unmount, and self-reset after its display window closes.

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Framer Motion mock — jsdom cannot run CSS animations; replace every motion.*
// with a plain element that renders children and drops framer-only props, and
// make AnimatePresence a pass-through so overlay presence is synchronous.
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Component = React.forwardRef(
          (
            { children, ...props }: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
            ref: React.Ref<HTMLElement>
          ) => {
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
            const element =
              tag === 'p' ? 'p' : tag === 'h2' ? 'h2' : tag === 'span' ? 'span' : 'div';
            return React.createElement(element, { ...domProps, ref }, children);
          }
        );
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

/**
 * Fires a keyboard sequence one key at a time, each in its own act() so React
 * flushes state + re-registers the listener between keystrokes — mirroring how
 * a real user types (the buffer only accumulates across separate renders).
 */
function typeSequence(sequence: string): void {
  sequence.split('').forEach((char) => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    });
  });
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('KonamiEasterEgg — error resilience (hydration, exception safety, fallbacks)', () => {
  // 1. Hydration stability: before the code is entered the component renders nothing,
  //    so the server and client trees match (empty) and mount/unmount never throw.
  it('renders an empty, hydration-stable tree before the secret is triggered', () => {
    let container: HTMLElement | undefined;
    expect(() => {
      const result = render(<KonamiEasterEgg />);
      container = result.container;
    }).not.toThrow();

    expect(container).toBeDefined();
    expect(container as HTMLElement).toBeEmptyDOMElement();
    expect(screen.queryByText('You Found It!')).toBeNull();
  });

  // 2. Exception safety: keystrokes originating from form fields are guarded out,
  //    and unexpected input must never throw or falsely trigger the overlay.
  it('safely ignores keystrokes from input fields without throwing or triggering', () => {
    // Render the input in the same tree as the component so the dispatched event
    // is guaranteed to share the DOM (and window) the listener is attached to.
    render(
      <>
        <KonamiEasterEgg />
        <input data-testid="text-field" />
      </>
    );
    const input = screen.getByTestId('text-field');

    expect(() => {
      'commit'.split('').forEach((char) => {
        act(() => {
          input.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        });
      });
    }).not.toThrow();

    // The guard (tagName === 'INPUT') means the code never registers → no overlay.
    expect(screen.queryByText('You Found It!')).toBeNull();
  });

  // 3. Error fallback on degenerate props: null/empty config must fall back to safe
  //    defaults (empty secret → default code, null counts → 0 particles) and still
  //    render the clean overlay instead of crashing.
  it('falls back gracefully when given null/empty configuration props', () => {
    expect(() =>
      render(
        <KonamiEasterEgg
          secretCode=""
          displayDuration={null}
          matrixCharCount={null}
          confettiCount={null}
        />
      )
    ).not.toThrow();

    // Empty secretCode falls back to the default code 'commit'.
    typeSequence('commit');

    // Overlay still recovers cleanly even with zero matrix/confetti particles.
    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  // 4. Lifecycle safety: the global listener is removed on unmount, and a late
  //    keydown after teardown must not throw or update an unmounted component.
  it('tears down the keydown listener on unmount and survives late events', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<KonamiEasterEgg />);

    // Capture the exact handler the component registered so we can assert the
    // very same reference is torn down — not merely "some" keydown listener.
    const registeredHandler = addSpy.mock.calls.find(([type]) => type === 'keydown')?.[1];
    expect(registeredHandler).toBeDefined();

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', registeredHandler);
    expect(() =>
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }))
    ).not.toThrow();
  });

  // 5. Self-reset / recovery path: once triggered the overlay auto-dismisses after the
  //    display window closes, restoring the idle state without user intervention.
  it('auto-resets to the idle state after the display duration elapses', () => {
    vi.useFakeTimers();
    render(<KonamiEasterEgg displayDuration={6000} />);

    typeSequence('commit');
    expect(screen.getByText('You Found It!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('You Found It!')).toBeNull();
  });
});
