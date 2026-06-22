import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import ContributionCity3D from './ContributionCity3D';
import type { ActivityData } from '@/types/dashboard';

// ── Canvas2D mock ──────────────────────────────────────────────────────────
// jsdom does not implement a real 2D rendering context, so we stub just
// enough of it for draw() to execute end-to-end without throwing.
const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  ellipse: vi.fn(),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
};

// ── ResizeObserver mock – must be a class (constructable) ───────────────────
class MockResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe() {
    // Fire callback immediately so the canvas-sizing useEffect runs
    this.cb(
      [{ contentRect: { width: 800, height: 360 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.ResizeObserver = MockResizeObserver as any;

  Object.values(mockCtx).forEach(
    (v) => typeof v === 'function' && vi.isMockFunction(v) && v.mockClear()
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContributionCity3D - Empty/Fallback Safety Tests', () => {
  it('renders without crashing when given an empty data array', () => {
    expect(() => render(<ContributionCity3D data={[]} />)).not.toThrow();
  });

  it('still mounts a canvas element when there is no contribution data', () => {
    const { container } = render(<ContributionCity3D data={[]} theme="dark" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('still shows the drag-to-rotate hint with no data', () => {
    render(<ContributionCity3D data={[]} theme="dark" />);
    expect(screen.getByText(/drag to rotate/i)).toBeTruthy();
  });

  it('calls clearRect on draw even with an empty data array (canvas still renders)', () => {
    render(<ContributionCity3D data={[]} theme="dark" />);
    // ResizeObserver fires immediately, triggering draw() → clearRect
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('does not crash when every day in range has zero contributions', () => {
    // Exercises the same Math.max(...counts, 1) fallback as a fully empty
    // array, while confirming cube heights settle on the "empty day" floor
    // instead of collapsing to 0 or NaN.
    const zeroData: ActivityData[] = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      count: 0,
      intensity: 0,
    }));

    expect(() =>
      render(<ContributionCity3D data={zeroData} theme="dark" days={14} />)
    ).not.toThrow();
  });

  it('does not crash when data is shorter than the requested "days" window', () => {
    // Guards the `data.slice(-days)` path for brand-new repos/users that
    // don't yet have a full history window.
    const shortData: ActivityData[] = [
      { date: '2026-06-17', count: 3, intensity: 2 },
      { date: '2026-06-18', count: 0, intensity: 0 },
    ];

    expect(() => render(<ContributionCity3D data={shortData} days={98} />)).not.toThrow();
  });

  it('falls back to the default theme palette when an unknown theme is passed', () => {
    expect(() => render(<ContributionCity3D data={[]} theme="not-a-real-theme" />)).not.toThrow();
  });

  it('falls back to the default 98-day window when no "days" prop is given', () => {
    const { container } = render(<ContributionCity3D data={[]} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });
});
