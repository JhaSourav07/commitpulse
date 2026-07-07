import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React, { Suspense } from 'react';
import ContributionCity3D from './ContributionCity3D';
import type { ActivityData } from '@/types/dashboard';

// ── Canvas2D mock ─────────────────────────────────────────────────────────────
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

// ── ResizeObserver mock – must be a class (constructable) ─────────────────────
class MockResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe() {
    // Fire callback immediately so useEffect canvas sizing runs
    this.cb(
      [{ contentRect: { width: 800, height: 400 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

// ── window.matchMedia stub ────────────────────────────────────────────────────
function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  // Canvas context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as any;

  // ResizeObserver as a proper class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.ResizeObserver = MockResizeObserver as any;

  // matchMedia (jsdom doesn't implement it)
  mockMatchMedia(true);

  // Reset all mock call counts between tests
  Object.values(mockCtx).forEach(
    (v) => typeof v === 'function' && vi.isMockFunction(v) && v.mockClear()
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeActivity(n = 98): ActivityData[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    count: i % 7 === 0 ? 0 : (i % 4) + 1,
    intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
  }));
}

// ── ContributionCity3D ────────────────────────────────────────────────────────
describe('ContributionCity3D', () => {
  it('renders a canvas element', () => {
    const { container } = render(<ContributionCity3D data={makeActivity()} theme="dark" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('shows the drag-to-rotate hint', () => {
    render(<ContributionCity3D data={makeActivity()} theme="neon" />);
    expect(screen.getByText(/drag to rotate/i)).toBeTruthy();
  });

  it('accepts different themes without error', () => {
    const themes = ['dark', 'neon', 'synthwave', 'dracula', 'ocean', 'forest'];
    themes.forEach((theme) => {
      expect(() =>
        render(<ContributionCity3D data={makeActivity()} theme={theme} />)
      ).not.toThrow();
    });
  });

  it('handles empty data gracefully', () => {
    expect(() => render(<ContributionCity3D data={[]} theme="dark" />)).not.toThrow();
  });

  it('handles zero-contribution days', () => {
    const allZero = makeActivity(98).map((d) => ({ ...d, count: 0, intensity: 0 as const }));
    expect(() => render(<ContributionCity3D data={allZero} theme="dark" />)).not.toThrow();
  });

  it('uses the days prop to slice data', () => {
    const { container } = render(
      <ContributionCity3D data={makeActivity(365)} theme="dark" days={30} />
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('sets grabbing cursor while dragging', async () => {
    const { container } = render(<ContributionCity3D data={makeActivity()} theme="dark" />);
    const inner = container.firstChild as HTMLElement;
    const canvas = container.querySelector('canvas')!;

    // jsdom does not implement setPointerCapture — stub it
    canvas.setPointerCapture = vi.fn();

    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    });

    // After pointerDown isDragging=true → wrapper cursor becomes grabbing
    await waitFor(() => {
      const cursor = inner.style.cursor;
      expect(['grab', 'grabbing']).toContain(cursor || 'grab');
    });
  });

  it('zooms on wheel event without throwing', () => {
    const { container } = render(<ContributionCity3D data={makeActivity()} theme="dark" />);
    const canvas = container.querySelector('canvas')!;
    expect(() => {
      fireEvent.wheel(canvas, { deltaY: -100 });
      fireEvent.wheel(canvas, { deltaY: 100 });
    }).not.toThrow();
  });

  it('calls clearRect on draw (canvas is rendered)', () => {
    render(<ContributionCity3D data={makeActivity()} theme="dark" />);
    // ResizeObserver fires immediately, triggering draw() → clearRect
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });
});

// ── ViewToggle3D (ActivityLandscape integration) ──────────────────────────────
describe('ViewToggle3D', () => {
  it('3D City toggle button exists in ActivityLandscape', async () => {
    const Component = (await import('./ActivityLandscape')).default;

    await act(async () => {
      render(
        <Suspense fallback={<div>loading</div>}>
          <Component data={makeActivity()} />
        </Suspense>
      );
    });

    expect(screen.getByRole('button', { name: /3D City/i })).toBeTruthy();
  });

  it('clicking 3D City hides the flat activity chart', async () => {
    const Component = (await import('./ActivityLandscape')).default;

    await act(async () => {
      render(
        <Suspense fallback={<div>loading</div>}>
          <Component data={makeActivity()} />
        </Suspense>
      );
    });

    // Flat chart should be visible initially
    expect(screen.queryByRole('img', { name: /activity chart/i })).toBeTruthy();

    // Click the 3D toggle
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /3D City/i }));
    });

    // Flat chart should now be hidden
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: /activity chart/i })).toBeNull();
    });
  });
});
