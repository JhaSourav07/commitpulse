import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import type { ReactNode, HTMLAttributes } from 'react';
import KonamiEasterEgg from './KonamiEasterEgg';

vi.useFakeTimers();

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({
          children,
          ...props
        }: {
          children?: ReactNode;
        } & HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    }
  ),
}));

describe('KonamiEasterEgg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  function triggerSecretCode() {
    'commit'.split('').forEach((key) => {
      fireEvent.keyDown(window, { key });
    });
  }

  it('activates when the secret code is entered', () => {
    render(<KonamiEasterEgg />);

    triggerSecretCode();

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
    expect(screen.getByText(/git commit -m/i)).toBeInTheDocument();
  });

  it('does not activate for an incorrect sequence', () => {
    render(<KonamiEasterEgg />);

    'commix'.split('').forEach((key) => {
      fireEvent.keyDown(window, { key });
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });

  it('matches only the complete secret code', () => {
    render(<KonamiEasterEgg />);

    'commi'.split('').forEach((key) => {
      fireEvent.keyDown(window, { key });
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 't' });

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('ignores keyboard events from input elements', () => {
    render(
      <>
        <input data-testid="input" />
        <KonamiEasterEgg />
      </>
    );

    const input = screen.getByTestId('input');

    'commit'.split('').forEach((key) => {
      fireEvent.keyDown(input, { key });
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });

  it('ignores keyboard events from textarea elements', () => {
    render(
      <>
        <textarea data-testid="textarea" />
        <KonamiEasterEgg />
      </>
    );

    const textarea = screen.getByTestId('textarea');

    'commit'.split('').forEach((key) => {
      fireEvent.keyDown(textarea, { key });
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });

  it('automatically hides after the configured duration', () => {
    render(<KonamiEasterEgg />);

    triggerSecretCode();

    expect(screen.getByText('You Found It!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });

  it('registers and removes the keydown listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<KonamiEasterEgg />);

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('can be triggered again after the overlay closes', () => {
    render(<KonamiEasterEgg />);

    triggerSecretCode();

    expect(screen.getByText('You Found It!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    triggerSecretCode();

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });
});
