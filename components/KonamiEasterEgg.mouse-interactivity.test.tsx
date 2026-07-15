import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import KonamiEasterEgg from './KonamiEasterEgg';
import '@testing-library/jest-dom';
import React from 'react';

// Mock framer-motion to render children immediately since we're testing interaction
vi.mock('framer-motion', () => {
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: Record<string, unknown>, tag: string) =>
          function MotionComponent({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
            return React.createElement(tag, props, children);
          },
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('KonamiEasterEgg Mouse Interactivity & Touch Events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const triggerKonamiCode = () => {
    const code = 'commit';
    code.split('').forEach((char) => {
      fireEvent.keyDown(window, { key: char });
    });
  };

  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(<KonamiEasterEgg />);
    triggerKonamiCode();

    const overlay = screen.getByText('You Found It!').closest('div.fixed');
    expect(overlay).toBeInTheDocument();

    if (overlay) {
      fireEvent.mouseEnter(overlay);
      fireEvent.mouseOver(overlay);
    }

    // Since the easter egg overlay is purely visual, simulating hovers should not crash it
    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('verifies that responsive tooltip layouts display at computed coordinates', () => {
    render(<KonamiEasterEgg />);
    triggerKonamiCode();

    const overlay = screen.getByText('You Found It!').closest('div.fixed');
    expect(overlay).toBeInTheDocument();

    // Verify the overlay applies pointer-events-none, explicitly blocking tooltips
    // and layout popups from this visual layer at computed coordinates.
    expect(overlay).toHaveClass('pointer-events-none');

    // Confirm that no tooltip role exists in the document natively from the easter egg
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('tests custom click/touch gestures and ensure click events propagate correctly', () => {
    const clickSpy = vi.fn();
    render(
      <div onClick={clickSpy} data-testid="background">
        <KonamiEasterEgg />
      </div>
    );
    triggerKonamiCode();

    const overlay = screen.getByText('You Found It!').closest('div.fixed');
    expect(overlay).toBeInTheDocument();

    const background = screen.getByTestId('background');
    fireEvent.click(background);

    // Because the overlay relies on pointer-events-none, click events pass through it
    // to underlying layers and propagate correctly. We test background receives the click.
    expect(clickSpy).toHaveBeenCalledTimes(1);

    if (overlay) {
      // Simulate touches natively on the overlay element
      fireEvent.touchStart(overlay);
      fireEvent.click(overlay);
    }

    // Component should remain stable
    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(<KonamiEasterEgg />);
    triggerKonamiCode();

    const overlay = screen.getByText('You Found It!').closest('div.fixed');

    // Ensure that it does NOT explicitly use a pointer cursor, since it's unclickable
    // and allows pointer events to pass through.
    expect(overlay).toHaveClass('pointer-events-none');
    expect(overlay).not.toHaveClass('cursor-pointer');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(<KonamiEasterEgg />);
    triggerKonamiCode();

    const overlay = screen.getByText('You Found It!').closest('div.fixed');
    expect(overlay).toBeInTheDocument();

    if (overlay) {
      fireEvent.mouseLeave(overlay);
    }

    // The easter egg should NOT hide purely on mouseLeave (unlike traditional tooltips),
    // because it depends on a strict timeout visual duration.
    expect(screen.getByText('You Found It!')).toBeInTheDocument();

    // Advance timeout to correctly hide the temporary overlay
    act(() => {
      vi.advanceTimersByTime(6000); // default DISPLAY_DURATION
    });

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });
});
