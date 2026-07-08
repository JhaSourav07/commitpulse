import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InteractiveViewer from './InteractiveViewer';

/**
 * mock-integrations (Variation 9) — Asynchronous Service Layer Mocking & Local Cache Stubs.
 *
 * NOTE ON SCOPE: InteractiveViewer is a pure client UI component — it performs no
 * network fetches and owns no database. The "service layer" it integrates with is its
 * asynchronously-mounted presentation dependencies (the framer-motion `AnimatePresence`
 * exit-animation layer and the `VisualizationTooltip` portal child), and its "local cache"
 * is the in-memory `activeTooltipRef` that is consulted before the component pays the cost
 * of recomputing tooltip geometry via `getBoundingClientRect`. These tests stub those
 * dependency modules and assert the cache-first + fallback + success-write behaviour that
 * the templated issue describes, against what the component genuinely does.
 */

// Stub the portal tooltip "service" so we assert against the mock, never the real module.
vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({
    title,
    x,
    children,
  }: {
    title: string;
    x: number;
    y: number;
    children: React.ReactNode;
  }) => (
    <div data-testid="visualization-tooltip" data-title={title} data-x={String(x)}>
      {children}
    </div>
  ),
}));

// Stub framer-motion's async exit-animation wrapper to a synchronous pass-through
// so the tooltip presence resolves deterministically inside jsdom.
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// jsdom has no layout engine, so getBoundingClientRect (the "retrieval" whose cost the
// cache exists to avoid) must be stubbed. We keep a handle to count invocations.
const rect: DOMRect = {
  left: 0,
  top: 0,
  right: 600,
  bottom: 400,
  width: 600,
  height: 400,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};

let rectSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  rectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** A single interactive tower with the data attributes the component reads. */
function Tower(props: { date: string; count: string; metric?: string }): React.ReactElement {
  return (
    <div
      className="interactive-tower"
      data-date={props.date}
      data-count={props.count}
      {...(props.metric ? { 'data-metric': props.metric } : {})}
    >
      Tower
    </div>
  );
}

describe('InteractiveViewer — mock integrations (async service layer + local cache stubs)', () => {
  // 1. Service layer is served entirely from the stub — a hover resolves the tooltip
  //    through the mocked module, proving no real dependency is reached.
  it('resolves the tooltip through the mocked async presentation layer, not the real module', () => {
    const { container } = render(
      <InteractiveViewer>
        <Tower date="2025-06-15" count="42" metric="Peak day" />
      </InteractiveViewer>
    );

    const tower = container.querySelector('.interactive-tower') as HTMLElement;
    act(() => {
      fireEvent.pointerMove(tower);
    });

    const tooltip = screen.getByTestId('visualization-tooltip');
    // Title comes from the component's formatDate(); count comes from the tower's data-count.
    expect(tooltip.getAttribute('data-title')).toBe('Jun 15, 2025');
    expect(screen.getByText('42')).toBeDefined();
  });

  // 2. Pending/idle state: the tooltip portal is not rendered until an interaction
  //    triggers the async "load" — the loading path starts empty.
  it('renders no tooltip in the idle/pending state before any interaction', () => {
    render(
      <InteractiveViewer>
        <Tower date="2025-06-15" count="42" metric="Peak day" />
      </InteractiveViewer>
    );

    expect(screen.queryByTestId('visualization-tooltip')).toBeNull();
  });

  // 3. Local cache stub: re-hovering the SAME date is a cache hit, so the component
  //    skips the expensive getBoundingClientRect "retrieval". A repeat move therefore
  //    costs exactly one call (the container's mousePos read) instead of two.
  it('queries the local tooltip cache before re-running geometry retrieval on repeat hovers', () => {
    const { container } = render(
      <InteractiveViewer>
        <Tower date="2025-06-15" count="42" metric="Peak day" />
      </InteractiveViewer>
    );

    const tower = container.querySelector('.interactive-tower') as HTMLElement;

    // First hover: cache MISS → container read + tower read (2 retrievals).
    const before = rectSpy.mock.calls.length;
    act(() => {
      fireEvent.pointerMove(tower);
    });
    const afterFirst = rectSpy.mock.calls.length;
    expect(afterFirst - before).toBe(2);

    // Second hover on the same date: cache HIT → only the container read (1 retrieval),
    // the tower geometry retrieval is skipped because the ref already holds this date.
    act(() => {
      fireEvent.pointerMove(tower);
    });
    const afterSecond = rectSpy.mock.calls.length;
    expect(afterSecond - afterFirst).toBe(1);
  });

  // 4. Fallback path: a tower missing required data (the analog of a failed/timed-out
  //    endpoint payload) must not write a tooltip — the component falls back to no-op.
  it('falls back to no tooltip when the interactive payload is incomplete', () => {
    const { container } = render(
      <InteractiveViewer>
        {/* metric intentionally omitted → guard `date && countStr && metric` fails */}
        <Tower date="2025-06-15" count="42" />
      </InteractiveViewer>
    );

    const tower = container.querySelector('.interactive-tower') as HTMLElement;
    act(() => {
      fireEvent.pointerMove(tower);
    });

    expect(screen.queryByTestId('visualization-tooltip')).toBeNull();
  });

  // 5. Success write-back: a tap (pointer down + up with negligible movement) resolves
  //    the element via elementFromPoint and syncs the tooltip cache — the success callback.
  it('writes the tooltip cache on a successful tap interaction', () => {
    const { container } = render(
      <InteractiveViewer>
        <Tower date="2025-06-15" count="42" metric="Active day" />
      </InteractiveViewer>
    );

    const viewer = container.firstChild as HTMLElement;
    const tower = container.querySelector('.interactive-tower') as HTMLElement;

    // The tap path locates the tower under the pointer via elementFromPoint, which
    // jsdom does not implement — assign a stub directly so the success path resolves.
    const fromPointSpy = vi.fn().mockReturnValue(tower);
    document.elementFromPoint = fromPointSpy as unknown as typeof document.elementFromPoint;

    act(() => {
      fireEvent.pointerDown(viewer, { clientX: 100, clientY: 100, pointerId: 1 });
      // Same coords → dx/dy < 5 → treated as a tap, not a drag.
      fireEvent.pointerUp(viewer, { clientX: 100, clientY: 100, pointerId: 1 });
    });

    expect(fromPointSpy).toHaveBeenCalled();
    expect(screen.getByTestId('visualization-tooltip')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });
});
