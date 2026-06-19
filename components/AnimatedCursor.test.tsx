import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

describe('AnimatedCursor Component', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    document.body.style.cursor = '';
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('bails out and does not hide native cursor on touch/mobile devices (pointer: fine matches false)', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<AnimatedCursor />);
    expect(document.body.style.cursor).not.toBe('none');
  });

  it('hides native cursor on desktop/mouse devices (pointer: fine matches true)', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<AnimatedCursor />);
    expect(document.body.style.cursor).toBe('none');
  });

  it('restores the default cursor styling on unmount', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(<AnimatedCursor />);
    expect(document.body.style.cursor).toBe('none');

    unmount();
    expect(document.body.style.cursor).toBe('');
  });

  it('updates cursor positions on mousemove event', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    const { container } = render(<AnimatedCursor />);
    const divs = container.querySelectorAll('div');
    const dot = divs[0];
    const ring = divs[1];

    fireEvent.mouseMove(window, { clientX: 100, clientY: 200 });

    expect(dot.style.transform).toBe('translate(96px, 196px)');

    // Execute animation frame callback once manually
    if (rafCallback) {
      (rafCallback as FrameRequestCallback)(0);
    }

    expect(ring.style.transform).toBe('translate(0px, 12px)');
    expect(ring.style.width).toBe('24px');
    expect(ring.style.height).toBe('24px');
  });

  it('applies hovering styling when moving pointer over interactive elements', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    const { container } = render(
      <div>
        <a href="#" data-testid="link">
          Link
        </a>
        <AnimatedCursor />
      </div>
    );

    const divs = container.querySelectorAll('div');
    const ring = divs[2];

    const link = container.querySelector('[data-testid="link"]');
    expect(link).not.toBeNull();

    fireEvent.mouseOver(link!);

    if (rafCallback) {
      (rafCallback as FrameRequestCallback)(0);
    }

    expect(ring.style.borderColor).toBe('rgb(88, 166, 255)');
    expect(ring.style.background).toBe('rgba(88, 166, 255, 0.08)');
    expect(ring.style.width).toBe('40px');
    expect(ring.style.height).toBe('40px');

    fireEvent.mouseOut(link!);

    if (rafCallback) {
      (rafCallback as FrameRequestCallback)(0);
    }

    expect(ring.style.borderColor).toBe('rgba(88, 166, 255, 0.5)');
    expect(ring.style.background).toBe('transparent');
    expect(ring.style.width).toBe('24px');
    expect(ring.style.height).toBe('24px');
  });

  it('does not apply hover styling when moving pointer over non-interactive elements', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    const { container } = render(
      <div>
        <span data-testid="span">Plain Text</span>
        <AnimatedCursor />
      </div>
    );

    const divs = container.querySelectorAll('div');
    const ring = divs[2];

    const span = container.querySelector('[data-testid="span"]');
    expect(span).not.toBeNull();

    fireEvent.mouseOver(span!);

    if (rafCallback) {
      (rafCallback as FrameRequestCallback)(0);
    }

    expect(ring.style.borderColor).toBe('rgba(88, 166, 255, 0.5)');
    expect(ring.style.background).toBe('transparent');

    fireEvent.mouseOut(span!);

    if (rafCallback) {
      (rafCallback as FrameRequestCallback)(0);
    }

    expect(ring.style.borderColor).toBe('rgba(88, 166, 255, 0.5)');
    expect(ring.style.background).toBe('transparent');
  });
});
