/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DeveloperArena from './DeveloperArena';
import React from 'react';

// Mock Next.js Image component (same approach as DeveloperArena.test.tsx)
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  },
}));

describe('components/DeveloperArena - Empty/Fallback Behavior (no IntersectionObserver)', () => {
  const originalIntersectionObserver = (globalThis as any).IntersectionObserver;

  beforeEach(() => {
    // Force the CountUp subcomponent's environment-detection fallback:
    // `supportsObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window`
    // With IntersectionObserver removed, CountUp must render the final value
    // immediately instead of waiting on an intersection event.
    delete (globalThis as any).IntersectionObserver;
  });

  afterEach(() => {
    if (originalIntersectionObserver) {
      (globalThis as any).IntersectionObserver = originalIntersectionObserver;
    }
    vi.clearAllMocks();
  });

  it('1. renders without crashing when IntersectionObserver is unavailable in the runtime', () => {
    const handleSelectBattle = vi.fn();

    expect(() => render(<DeveloperArena onSelectBattle={handleSelectBattle} />)).not.toThrow();
  });

  it('2. immediately shows the final stat counts instead of starting from zero', () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    // `toLocaleString()` is locale-dependent (comma vs. period vs. space vs.
    // lakh-style grouping), so match on digits only rather than a hardcoded
    // separator-formatted string. No waitFor/timers needed: with the observer
    // fallback active, CountUp's initial state is already the resolved
    // `to` value, not 0.
    const matchesDigits = (expected: number) => (content: string) =>
      content.replace(/[^0-9]/g, '') === String(expected);

    expect(screen.getByText(matchesDigits(142580))).toBeInTheDocument();
    expect(screen.getByText(matchesDigits(894204))).toBeInTheDocument();
    expect(screen.getByText(matchesDigits(147))).toBeInTheDocument();
    expect(screen.getByText(matchesDigits(3412))).toBeInTheDocument();
  });

  it('3. still renders the core section headings while running in fallback mode', () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    expect(screen.getByText('Developer Battleground')).toBeInTheDocument();
    expect(screen.getByText('Step Into the Esports Arena')).toBeInTheDocument();
    expect(screen.getByText('Trending Showdowns')).toBeInTheDocument();
    expect(screen.getByText('Guess The Developer')).toBeInTheDocument();
    expect(screen.getByText('AI Showdown Predictions')).toBeInTheDocument();
    expect(screen.getByText('GitHub Legends Walk of Fame')).toBeInTheDocument();
  });

  it('4. unmounts cleanly with no errors while operating without IntersectionObserver', () => {
    const handleSelectBattle = vi.fn();
    const { unmount } = render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    expect(() => unmount()).not.toThrow();
  });

  it('5. survives repeated mount/unmount cycles under the fallback path without leaking errors', () => {
    const handleSelectBattle = vi.fn();

    expect(() => {
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(<DeveloperArena onSelectBattle={handleSelectBattle} />);
        unmount();
      }
    }).not.toThrow();
  });

  it('6. keeps showdown and legend marquees populated even though counters skip their reveal animation', () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    // The marquees are independent of the CountUp/IntersectionObserver
    // fallback, so their hardcoded content should remain fully populated.
    expect(screen.getAllByText('React vs Svelte').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Linus Torvalds').length).toBeGreaterThan(0);
  });
});
