/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DeveloperArena from './DeveloperArena';
import React from 'react';

// Mock Next.js Image component (same approach as DeveloperArena.test.tsx)
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const GAME_CHALLENGE_COUNT = 7; // matches GAME_CHALLENGES.length in DeveloperArena.tsx
const PREDICTION_COUNT = 4; // matches PREDICTIONS.length in DeveloperArena.tsx

describe('DeveloperArena - Massive Scaling & Extreme High-Bounds Stress Tests', () => {
  // 1. Render performance under a single mount
  it('renders within acceptable performance limits', () => {
    const start = performance.now();
    render(<DeveloperArena onSelectBattle={vi.fn()} />);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  // 2. Many simultaneous instances on one page (e.g. a future comparison grid)
  it('renders 25 simultaneous instances without throwing or degrading correctness', () => {
    const handleSelectBattle = vi.fn();
    const start = performance.now();

    expect(() => {
      render(
        <>
          {Array.from({ length: 25 }, (_, i) => (
            <DeveloperArena key={i} onSelectBattle={handleSelectBattle} />
          ))}
        </>
      );
    }).not.toThrow();

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(20000);

    // Every instance should mount its own heading
    expect(screen.getAllByText('Developer Battleground')).toHaveLength(25);
  });

  // 3. Long-running autoplay timer: thousands of 1s ticks across the
  // trivia-game countdown, verifying the gameIdx modulo wrap never goes
  // out of bounds or produces NaN/undefined content.
  it('survives 500 seconds of autoplay ticks (50x the full challenge-list cycle) without breaking', () => {
    vi.useFakeTimers();
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(500 * 1000);
      });
    }).not.toThrow();

    // After exactly 50 full cycles (500 / 10s-per-challenge gives 50 * 7 = 350
    // challenge advances, i.e. an exact multiple of GAME_CHALLENGE_COUNT),
    // the displayed hint should land back on the first challenge's stats.
    expect(screen.getByText(/Creator of Redux/i)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
  });

  // 4. Long-running prediction rotation timer (7s interval), well beyond a
  // single pass through PREDICTIONS.
  it('survives 1000 prediction-rotation cycles without index drift or crashes', () => {
    vi.useFakeTimers();
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    expect(() => {
      act(() => {
        for (let i = 0; i < PREDICTION_COUNT * 1000; i++) {
          vi.advanceTimersByTime(7000);
        }
      });
    }).not.toThrow();

    // 4000 advances is an exact multiple of PREDICTION_COUNT, so it should
    // land back on the first prediction's matchup.
    expect(screen.getByText(/Frontend Champion/i)).toBeInTheDocument();
  });

  // 5. Rapid-fire "Skip" clicks far beyond the challenge list length, to
  // stress the (prevIdx + 1) % GAME_CHALLENGES.length wraparound logic.
  it('cycles cleanly through 200 rapid Skip clicks (≈28 full passes through the challenge list)', () => {
    render(<DeveloperArena onSelectBattle={vi.fn()} />);
    const skipButton = screen.getByRole('button', { name: /skip/i });

    expect(() => {
      for (let i = 0; i < 200; i++) {
        fireEvent.click(skipButton);
      }
    }).not.toThrow();

    // 200 is an exact multiple of GAME_CHALLENGE_COUNT (28 * 7), so we
    // should land back on the first challenge.
    expect(screen.getByText(/Creator of Redux/i)).toBeInTheDocument();
  });

  // 6. Rapid reveal/skip toggling stress test — alternates the AnimatePresence
  // branch hundreds of times to check for state corruption or thrown errors.
  it('handles 100 rapid reveal → skip → reveal toggles without state corruption', () => {
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    expect(() => {
      for (let i = 0; i < 100; i++) {
        fireEvent.click(screen.getByRole('button', { name: /reveal developer/i }));
        fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      }
    }).not.toThrow();

    // After toggling, the hint view (not the reveal view) should be active
    // again, since Skip always resets `revealed` to false.
    expect(screen.getByRole('button', { name: /reveal developer/i })).toBeInTheDocument();
  });

  // 7. High-frequency pointer movement across the spotlight-tracking arena
  // (handleMouseMove updates React state on every event).
  it('processes 400 rapid mousemove events without producing NaN/Infinity in the spotlight gradient', () => {
    const { container } = render(<DeveloperArena onSelectBattle={vi.fn()} />);
    const arena = container.firstChild as HTMLElement;

    expect(() => {
      fireEvent.mouseEnter(arena);
      for (let i = 0; i < 400; i++) {
        fireEvent.mouseMove(arena, { clientX: i % 800, clientY: i % 400 });
      }
    }).not.toThrow();

    const spotlight = arena.querySelector('div[style*="radial-gradient"]') as HTMLElement;
    expect(spotlight).toBeTruthy();
    expect(spotlight.getAttribute('style')).not.toContain('NaN');
    expect(spotlight.getAttribute('style')).not.toContain('Infinity');
  });

  // 8. Sequential mount/unmount stress test at a larger scale than the
  // empty-fallback suite, to catch any cumulative timer/listener leaks.
  it('survives 50 sequential mount/unmount cycles without throwing', () => {
    expect(() => {
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<DeveloperArena onSelectBattle={vi.fn()} />);
        unmount();
      }
    }).not.toThrow();
  });

  // 9. Combined stress: many instances, each independently driven through a
  // skip cycle, to ensure component instances don't share/corrupt state.
  it('keeps independent state across many instances under simultaneous interaction', () => {
    const handleSelectBattle = vi.fn();
    const { container } = render(
      <>
        <div data-testid="arena-a">
          <DeveloperArena onSelectBattle={handleSelectBattle} />
        </div>
        <div data-testid="arena-b">
          <DeveloperArena onSelectBattle={handleSelectBattle} />
        </div>
      </>
    );

    const arenaA = within(screen.getByTestId('arena-a'));
    const arenaB = within(screen.getByTestId('arena-b'));

    // Advance only arena A by 3 skips; arena B should remain on the first
    // challenge, proving the two instances don't share module-level state.
    for (let i = 0; i < 3; i++) {
      fireEvent.click(arenaA.getByRole('button', { name: /skip/i }));
    }

    expect(arenaB.getByText(/Creator of Redux/i)).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
