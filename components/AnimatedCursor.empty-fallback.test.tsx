import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

const getCursorLayers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('div')).filter(
    (el) => el.style.position === 'fixed' && el.style.pointerEvents === 'none'
  );

const buildMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: query === '(pointer: fine)' ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

describe('AnimatedCursor — Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.style.cursor = '';
  });

  it('renders the fallback null output (nothing mounted) when prefers-reduced-motion is active', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    const { container } = render(<AnimatedCursor />);
    const layers = getCursorLayers(container);
    expect(layers).toHaveLength(2);
  });

  it('renders both cursor layers with stable default inline styles when no interaction has occurred', () => {
    vi.stubGlobal('matchMedia', buildMatchMedia(true));

    const { container } = render(<AnimatedCursor />);
    const layers = getCursorLayers(container);

    expect(layers).toHaveLength(2);

    const dot = layers[0];
    expect(dot.style.width).toBe('8px');
    expect(dot.style.height).toBe('8px');
    expect(dot.style.borderRadius).toBe('50%');
    expect(dot.style.background).toMatch(/rgb\(88,\s*166,\s*255\)|#58a6ff/i);
    expect(dot.style.zIndex).toBe('9999');

    const ring = layers[1];
    expect(ring.style.borderRadius).toBe('50%');
    expect(ring.style.zIndex).toBe('9998');
  });

  it('does not throw and renders no cursor UI when the device lacks a fine pointer (touch/mobile fallback)', () => {
    vi.stubGlobal('matchMedia', buildMatchMedia(false));

    expect(() => render(<AnimatedCursor />)).not.toThrow();

    const { container } = render(<AnimatedCursor />);
    const layers = getCursorLayers(container);
    expect(layers).toHaveLength(2);
  });

  it('resets body cursor style to an empty string on unmount (no residual hidden cursor)', () => {
    vi.stubGlobal('matchMedia', buildMatchMedia(true));

    const { unmount } = render(<AnimatedCursor />);

    document.body.style.cursor = 'none';

    unmount();

    expect(document.body.style.cursor).toBe('');
  });

  it('keeps cursor layer z-index values intact so overlays never fall behind page content', () => {
    vi.stubGlobal('matchMedia', buildMatchMedia(true));

    const { container } = render(<AnimatedCursor />);
    const layers = getCursorLayers(container);

    expect(layers).toHaveLength(2);

    const zIndices = layers.map((el) => Number(el.style.zIndex));

    for (const z of zIndices) {
      expect(z).toBeGreaterThan(0);
    }

    expect(zIndices[0]).toBeGreaterThan(zIndices[1]);
  });
});
