import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import ContributionCity3D from './ContributionCity3D';
import type { ActivityData } from '@/types/dashboard';

// Canvas mock
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

class MockResizeObserver {
  constructor(private cb: ResizeObserverCallback) {}

  observe() {
    this.cb(
      [{ contentRect: { width: 1200, height: 800 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }

  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => mockCtx
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function generateLargeDataset(size: number): ActivityData[] {
  return Array.from({ length: size }, (_, i) => ({
    date: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    count: (i % 500) + 1,
    intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
  }));
}

describe('ContributionCity3D Massive Scaling', () => {
  it('renders successfully with 1,000 contribution records', () => {
    const data = generateLargeDataset(1000);

    expect(() => render(<ContributionCity3D data={data} days={1000} />)).not.toThrow();
  });

  it('renders successfully with 5,000 contribution records', () => {
    const data = generateLargeDataset(5000);

    expect(() => render(<ContributionCity3D data={data} days={5000} />)).not.toThrow();
  });

  it('renders successfully with 10,000 contribution records', () => {
    const data = generateLargeDataset(10000);

    expect(() => render(<ContributionCity3D data={data} days={10000} />)).not.toThrow();
  });

  it('draws on canvas for massive datasets', () => {
    const data = generateLargeDataset(10000);

    render(<ContributionCity3D data={data} days={10000} />);

    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.beginPath).toHaveBeenCalled();
  });

  it('supports rerendering with increasingly larger datasets', () => {
    const first = generateLargeDataset(500);
    const second = generateLargeDataset(5000);

    const { rerender } = render(<ContributionCity3D data={first} days={500} />);

    expect(() => rerender(<ContributionCity3D data={second} days={5000} />)).not.toThrow();
  });

  it('handles all supported themes with large datasets', () => {
    const data = generateLargeDataset(3000);

    const themes = [
      'dark',
      'neon',
      'dracula',
      'synthwave',
      'ocean',
      'forest',
      'github',
      'rose',
      'nord',
      'sunset',
    ];

    themes.forEach((theme) => {
      const { unmount } = render(<ContributionCity3D data={data} days={3000} theme={theme} />);

      unmount();
    });
  });

  it('keeps canvas mounted with 10k records', () => {
    const data = generateLargeDataset(10000);

    const { container } = render(<ContributionCity3D data={data} days={10000} />);

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles extreme days window values without crashing', () => {
    const data = generateLargeDataset(10000);

    expect(() => render(<ContributionCity3D data={data} days={50000} />)).not.toThrow();
  });
});
