import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import ContributionCity3D from './ContributionCity3D';
import type { ActivityData } from '@/types/dashboard';

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
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
};

const disconnectSpy = vi.fn();
const observeSpy = vi.fn();

class MockResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe = observeSpy;

  disconnect = disconnectSpy;

  unobserve = vi.fn();
}

const sampleData: ActivityData[] = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-01-${String(i + 1).padStart(2, '0')}`,
  count: (i % 5) + 1,
  intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
}));

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => mockCtx),
  });

  Object.defineProperty(global, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: MockResizeObserver,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContributionCity3D Integration', () => {
  it('mounts and initializes canvas rendering', () => {
    render(<ContributionCity3D data={sampleData} />);

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('registers ResizeObserver on mount', () => {
    render(<ContributionCity3D data={sampleData} />);

    expect(observeSpy).toHaveBeenCalled();
  });

  it('disconnects ResizeObserver on unmount', () => {
    const { unmount } = render(<ContributionCity3D data={sampleData} />);

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('renders a canvas element', () => {
    const { container } = render(<ContributionCity3D data={sampleData} />);

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders interaction hint text', () => {
    const { getByText } = render(<ContributionCity3D data={sampleData} />);

    expect(getByText(/drag to rotate/i)).toBeInTheDocument();
  });

  it('supports pointer drag interactions', () => {
    const { container } = render(<ContributionCity3D data={sampleData} />);

    const canvas = container.querySelector('canvas')!;

    canvas.setPointerCapture = vi.fn();

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });

    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      clientX: 150,
      clientY: 120,
    });

    fireEvent.pointerUp(canvas);

    expect(canvas.setPointerCapture).toHaveBeenCalled();
  });

  it('supports wheel zoom interactions', () => {
    const { container } = render(<ContributionCity3D data={sampleData} />);

    const canvas = container.querySelector('canvas')!;

    fireEvent.wheel(canvas, {
      deltaY: 100,
    });

    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('re-renders when theme changes', () => {
    const { rerender } = render(<ContributionCity3D data={sampleData} theme="dark" />);

    const before = mockCtx.clearRect.mock.calls.length;

    rerender(<ContributionCity3D data={sampleData} theme="neon" />);

    expect(mockCtx.clearRect.mock.calls.length).toBeGreaterThan(before);
  });

  it('re-renders when data changes', () => {
    const { rerender } = render(<ContributionCity3D data={sampleData} />);

    const before = mockCtx.clearRect.mock.calls.length;

    rerender(
      <ContributionCity3D
        data={[
          ...sampleData,
          {
            date: '2026-02-01',
            count: 10,
            intensity: 4,
          },
        ]}
      />
    );

    expect(mockCtx.clearRect.mock.calls.length).toBeGreaterThan(before);
  });

  it('handles empty data without crashing', () => {
    expect(() => {
      render(<ContributionCity3D data={[]} />);
    }).not.toThrow();
  });
});
