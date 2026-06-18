import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AIInsightsSkeleton from './AIInsightsSkeleton';

const MASS_COUNT = 100;

describe('AIInsightsSkeleton - Massive Scaling', () => {
  afterEach(() => {
    cleanup();
  });

  // ------------------------------------------------------------------
  // Test 1 — Large-scale render stability
  // ------------------------------------------------------------------
  it('renders a large batch of skeleton instances without runtime errors', () => {
    const instances = Array.from({ length: MASS_COUNT }, (_, i) => (
      <div key={i} data-testid={`skeleton-wrapper-${i}`}>
        <AIInsightsSkeleton />
      </div>
    ));

    const { container } = render(<>{instances}</>);

    // All wrappers are present
    const wrappers = container.querySelectorAll('[data-testid^="skeleton-wrapper-"]');
    expect(wrappers.length).toBe(MASS_COUNT);

    // Every wrapper has a mounted child
    wrappers.forEach((wrapper) => {
      expect(wrapper.children.length).toBe(1);
    });

    // The root skeleton divs are present inside every wrapper
    const rootDivs = container.querySelectorAll('.p-6.rounded-xl.bg-\\[\\#0a0a0a\\]');
    expect(rootDivs.length).toBe(MASS_COUNT);
  });

  // ------------------------------------------------------------------
  // Test 2 — Massive container rendering
  // ------------------------------------------------------------------
  it('maintains DOM structure integrity when rendered inside a simulated thousands-item dashboard grid', () => {
    const items = Array.from({ length: 500 }, (_, i) => (
      <div key={i} data-testid="dashboard-item">
        <AIInsightsSkeleton />
      </div>
    ));

    const { container } = render(<div data-testid="massive-dashboard">{items}</div>);

    // Dashboard container exists
    expect(container.querySelector('[data-testid="massive-dashboard"]')).toBeInTheDocument();

    // All 500 items present
    expect(container.querySelectorAll('[data-testid="dashboard-item"]')).toHaveLength(500);

    // All skeleton root containers present
    const rootDivs = container.querySelectorAll('.p-6.rounded-xl.border');
    expect(rootDivs.length).toBe(500);
  });

  // ------------------------------------------------------------------
  // Test 3 — Layout consistency under extreme load
  // ------------------------------------------------------------------
  it('preserves all skeleton rows and header elements when many copies are rendered simultaneously', () => {
    const { container } = render(
      <>
        {Array.from({ length: MASS_COUNT }, (_, i) => (
          <AIInsightsSkeleton key={i} />
        ))}
      </>
    );

    // Count all row wrappers (3 per skeleton)
    const allRows = container.querySelectorAll('.flex.items-start.gap-3');
    expect(allRows.length).toBe(MASS_COUNT * 3);

    // Count all header rows (1 per skeleton) — the header flex container
    const headerFlex = container.querySelectorAll('.flex.items-center.gap-2\\.5');
    expect(headerFlex.length).toBe(MASS_COUNT);

    // Every skeleton has a header with a shimmer circle + shimmer text
    headerFlex.forEach((header) => {
      const headerShimmers = (header as HTMLElement).querySelectorAll('.shimmer');
      expect(headerShimmers.length).toBe(2);
    });

    // Every insight row has at least one shimmer (icon + text)
    allRows.forEach((row) => {
      const shimmers = (row as HTMLElement).querySelectorAll('.shimmer');
      expect(shimmers.length).toBeGreaterThanOrEqual(3); // 1 icon + 2 text
    });
  });

  // ------------------------------------------------------------------
  // Test 4 — Visual placeholder scaling integrity
  // ------------------------------------------------------------------
  it('renders all shimmer blocks and text placeholders correctly under repetition', () => {
    const { container } = render(
      <>
        {Array.from({ length: MASS_COUNT }, (_, i) => (
          <AIInsightsSkeleton key={i} />
        ))}
      </>
    );

    // Each skeleton has 3 icon placeholders (w-4 h-4 shimmer rounded-full mt-1)
    const iconShimmers = container.querySelectorAll(
      'div[class*="w-4"][class*="h-4"][class*="shimmer"][class*="rounded-full"][class*="mt-1"]'
    );
    expect(iconShimmers.length).toBe(MASS_COUNT * 3);

    // Each skeleton has 6 text shimmer bars (2 per row × 3 rows)
    const textShimmers = container.querySelectorAll('.h-3.shimmer.rounded');
    expect(textShimmers.length).toBe(MASS_COUNT * 6);

    // Each skeleton has 2 header shimmers inside the header section
    // Count header circle shimmers (w-4 h-4 shimmer rounded-full opacity-80 inside .mb-5)
    const headerCircles = container.querySelectorAll(
      'div.mb-5 > div[class*="w-4"][class*="h-4"][class*="shimmer"][class*="rounded-full"][class*="opacity-80"]'
    );
    expect(headerCircles.length).toBe(MASS_COUNT);

    // Count header text shimmers (w-24 h-4 shimmer rounded opacity-80 inside .mb-5)
    const headerTexts = container.querySelectorAll(
      'div.mb-5 > div[class*="w-24"][class*="h-4"][class*="shimmer"][class*="rounded"][class*="opacity-80"]'
    );
    expect(headerTexts.length).toBe(MASS_COUNT);
  });

  // ------------------------------------------------------------------
  // Test 5 — Performance-oriented render validation
  // ------------------------------------------------------------------
  it('completes rendering within acceptable time for a unit test environment', () => {
    const start = performance.now();

    render(
      <>
        {Array.from({ length: MASS_COUNT }, (_, i) => (
          <AIInsightsSkeleton key={i} />
        ))}
      </>
    );

    const elapsed = performance.now() - start;

    // 100 skeleton instances rendered in under 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });

  // ------------------------------------------------------------------
  // Additional: re-render and unmount stability
  // ------------------------------------------------------------------
  it('survives re-render and unmount cycles without throwing', () => {
    const { rerender, unmount } = render(
      <>
        {Array.from({ length: 50 }, (_, i) => (
          <AIInsightsSkeleton key={`first-${i}`} />
        ))}
      </>
    );

    rerender(
      <>
        {Array.from({ length: 75 }, (_, i) => (
          <AIInsightsSkeleton key={`second-${i}`} />
        ))}
      </>
    );

    expect(() => unmount()).not.toThrow();
  });
});
