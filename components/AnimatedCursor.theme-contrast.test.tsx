import { render, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

type Scheme = 'light' | 'dark';

function mockThemeEnvironment(scheme: Scheme) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(pointer: fine)' || query === `(prefers-color-scheme: ${scheme})`,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  document.documentElement.classList.toggle('dark', scheme === 'dark');
  document.documentElement.style.colorScheme = scheme;
}

function getCursorParts(container: HTMLElement) {
  const [dot, ring] = Array.from(container.querySelectorAll('div'));

  expect(dot).toBeInstanceOf(HTMLDivElement);
  expect(ring).toBeInstanceOf(HTMLDivElement);

  return { dot: dot as HTMLDivElement, ring: ring as HTMLDivElement };
}

describe('AnimatedCursor dark/light visual cohesion', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('maintains static premium styling across light and dark color-scheme environments', () => {
    for (const scheme of ['light', 'dark'] as const) {
      mockThemeEnvironment(scheme);
      const { container, unmount } = render(<AnimatedCursor />);
      const { dot, ring } = getCursorParts(container);

      expect(window.matchMedia(`(prefers-color-scheme: ${scheme})`).matches).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe(scheme);
      expect(dot.style.background).toBe('rgb(88, 166, 255)');
      expect(ring.style.border).toContain('rgba(88, 166, 255, 0.5)');

      unmount();
    }
  });

  it('keeps cursor layers theme-safe and restores the native cursor on unmount', () => {
    mockThemeEnvironment('dark');
    const { container, unmount } = render(<AnimatedCursor />);
    const { dot, ring } = getCursorParts(container);

    expect(document.body.style.cursor).toBe('none');
    expect(dot.style.position).toBe('fixed');
    expect(ring.style.position).toBe('fixed');
    expect(dot.style.pointerEvents).toBe('none');
    expect(ring.style.pointerEvents).toBe('none');
    expect(Number(dot.style.zIndex)).toBeGreaterThan(Number(ring.style.zIndex));

    unmount();
    expect(document.body.style.cursor).toBe('');
  });

  it('has no textual cursor content that can fail foreground contrast in either theme', () => {
    for (const scheme of ['light', 'dark'] as const) {
      mockThemeEnvironment(scheme);
      const { container, unmount } = render(<AnimatedCursor />);

      const textContent = container.textContent?.trim() ?? '';
      const textBearingElements = Array.from(container.querySelectorAll('*')).filter(
        (element) => (element.textContent?.trim() ?? '').length > 0
      );

      expect(textContent).toBe('');
      expect(textBearingElements).toHaveLength(0);

      unmount();
    }
  });

  it('keeps custom inline visual properties active for the dot and ring markup', () => {
    mockThemeEnvironment('light');
    const { container, unmount } = render(<AnimatedCursor />);
    const { dot, ring } = getCursorParts(container);

    expect(dot.style.width).toBe('8px');
    expect(dot.style.height).toBe('8px');
    expect(dot.style.borderRadius).toBe('50%');
    expect(dot.style.transition).toBe('opacity 0.2s');
    expect(ring.style.borderRadius).toBe('50%');
    expect(ring.style.transition).toBe(
      'width 0.2s, height 0.2s, border-color 0.2s, background 0.2s'
    );

    unmount();
  });

  it('keeps the hover overlay translucent so foreground cursor color is not clipped', () => {
    mockThemeEnvironment('dark');
    const { container, unmount } = render(<AnimatedCursor />);
    const { dot, ring } = getCursorParts(container);

    const target = document.createElement('button');
    document.body.appendChild(target);
    fireEvent.mouseOver(target);

    expect(dot.style.background).toBe('rgb(88, 166, 255)');
    expect(ring.style.border).toContain('rgb(88, 166, 255)');
    expect(ring.style.background).toBe('rgba(88, 166, 255, 0.08)');
    expect(ring.style.background).not.toBe('transparent');
    expect(ring.style.pointerEvents).toBe('none');

    target.remove();
    unmount();
  });
});
