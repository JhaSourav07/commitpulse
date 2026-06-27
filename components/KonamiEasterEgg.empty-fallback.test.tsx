import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocks configuration for framer-motion
interface MockMotionProps extends React.HTMLAttributes<HTMLElement> {
  animate?: unknown;
  transition?: unknown;
  initial?: unknown;
  exit?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  variants?: unknown;
}

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        void _target;
        const Component = React.forwardRef<HTMLElement, MockMotionProps>(
          (
            {
              children,
              initial: _initial,
              animate: _animate,
              exit: _exit,
              transition: _transition,
              whileHover: _whileHover,
              whileTap: _whileTap,
              variants: _variants,
              ...domProps
            },
            ref
          ) => {
            void _initial;
            void _animate;
            void _exit;
            void _transition;
            void _whileHover;
            void _whileTap;
            void _variants;
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

// Helper to fire the secret code keydown sequence on window
function triggerSecretCode(code: string = 'commit') {
  code.split('').forEach((char) => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    });
  });
}

describe('KonamiEasterEgg - Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('1. renders safely with empty arrays when matrix and confetti counts are set to 0', () => {
    expect(() => render(<KonamiEasterEgg matrixCharCount={0} confettiCount={0} />)).not.toThrow();

    triggerSecretCode();

    // The heading "You Found It!" should still render correctly
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('2. handles null, undefined, or absent props without crashing', () => {
    expect(() =>
      render(
        <KonamiEasterEgg
          secretCode={null}
          displayDuration={null}
          matrixCharCount={null}
          confettiCount={null}
        />
      )
    ).not.toThrow();

    triggerSecretCode('commit'); // Falls back to default 'commit'
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('3. verifies default layout structure and styling classes remain intact when triggered with empty configuration', () => {
    const { container } = render(<KonamiEasterEgg matrixCharCount={0} confettiCount={0} />);

    triggerSecretCode();

    const overlay = container.querySelector('.fixed.inset-0.z-\\[9999\\]');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.className).toContain('pointer-events-none');
    expect(overlay?.className).toContain('overflow-hidden');

    const backdrop = container.querySelector('.bg-black\\/70');
    expect(backdrop).toBeInTheDocument();
  });

  it('4. ensures no runtime exceptions occur during multiple sequential re-renders with changing empty inputs', () => {
    const { rerender } = render(<KonamiEasterEgg matrixCharCount={0} confettiCount={0} />);

    expect(() => {
      rerender(<KonamiEasterEgg matrixCharCount={null} confettiCount={null} />);
      rerender(<KonamiEasterEgg secretCode="" displayDuration={0} />);
      rerender(<KonamiEasterEgg />);
    }).not.toThrow();
  });

  it('5. confirms key DOM nodes and text elements exist even when no data or configuration is available', () => {
    render(<KonamiEasterEgg matrixCharCount={0} confettiCount={0} />);

    // Prior to typing secret code, nothing should be in DOM
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    triggerSecretCode();

    // Visual card elements and content must be present
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('You Found It!');
    expect(screen.getByText(/git commit -m/i)).toBeInTheDocument();
    expect(screen.getByText(/CommitPulse/i)).toBeInTheDocument();
  });
});
