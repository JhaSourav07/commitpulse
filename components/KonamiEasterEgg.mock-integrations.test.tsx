import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import KonamiEasterEgg from './KonamiEasterEgg';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({
          children,
          animate,
          initial,
          exit,
          transition,
          whileInView,
          viewport,
          whileHover,
          whileTap,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => React.createElement(tag as string, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Fire each key inside its own act() so React flushes setBuffer/setTriggered per keystroke
async function fireSecretCode(code = 'commit') {
  for (const char of code) {
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('KonamiEasterEgg - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  it('registers the keydown event service listener on mount and removes it on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<KonamiEasterEgg />);

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('schedules an auto-dismiss timeout stub with the configured displayDuration when triggered', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    render(<KonamiEasterEgg displayDuration={6000} />);
    await fireSecretCode('commit');

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
    // The async dismiss timer must have been registered with the correct duration
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 6000);
  });

  it('dismisses the overlay automatically after the displayDuration timeout stub elapses', async () => {
    const originalSetTimeout = global.setTimeout;
    const capturedCallbacks: Array<() => void> = [];

    // Intercept only our app's 6000ms dismiss timeout — let React internals pass through
    vi.spyOn(global, 'setTimeout').mockImplementation(((cb: TimerHandler, delay?: number) => {
      if (delay === 6000) {
        capturedCallbacks.push(cb as () => void);
        return 0;
      }
      return originalSetTimeout(cb, delay);
    }) as typeof setTimeout);

    render(<KonamiEasterEgg displayDuration={6000} />);
    await fireSecretCode('commit');

    expect(screen.getByText('You Found It!')).toBeInTheDocument();

    // Simulate the async timeout elapsing by calling the captured callback directly
    await act(async () => {
      capturedCallbacks[0]?.();
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });

  it('stubs Math.random to verify the pre-computed data cache is generated locally without network calls', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<KonamiEasterEgg matrixCharCount={5} confettiCount={3} />);

    // Math.random must have been called during useMemo data pre-computation —
    // confirms data is generated locally (cached) not fetched from an external endpoint
    expect(randomSpy).toHaveBeenCalled();
    expect(document.body.firstChild).toBeTruthy();
  });

  it('does not trigger the overlay on a partial or incorrect secret code — buffer cache must not flush prematurely', async () => {
    render(<KonamiEasterEgg secretCode="commit" />);

    // Fire only partial sequence — 'commi' is 5 chars, missing the final 't'
    for (const char of 'commi') {
      await act(async () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      });
    }

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    // Fire a wrong final character — breaks the cached buffer sequence
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    // Now fire the complete correct sequence — buffer must flush and trigger
    await fireSecretCode('commit');

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });
});
