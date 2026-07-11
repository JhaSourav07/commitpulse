import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import AnimatedCursor from './AnimatedCursor';

describe('AnimatedCursor Error Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  });

  it('1. renders without crashing when browser APIs are available', () => {
    expect(() => render(<AnimatedCursor />)).not.toThrow();
  });

  it('2. safely mounts even if animation frame is mocked', () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    expect(() => render(<AnimatedCursor />)).not.toThrow();
  });

  it('3. keeps rendering cursor elements after initialization', () => {
    const { container } = render(<AnimatedCursor />);

    expect(container.querySelectorAll('div')).toHaveLength(2);
  });

  it('4. cleans up gracefully on unmount', () => {
    const { unmount } = render(<AnimatedCursor />);

    expect(() => unmount()).not.toThrow();
  });

  it('5. remains resilient across repeated mount/unmount cycles', () => {
    expect(() => {
      const first = render(<AnimatedCursor />);
      first.unmount();

      const second = render(<AnimatedCursor />);
      second.unmount();
    }).not.toThrow();
  });
});
