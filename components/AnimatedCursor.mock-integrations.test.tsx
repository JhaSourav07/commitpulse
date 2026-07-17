import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

describe('AnimatedCursor Mock Integrations', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    document.body.style.cursor = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.cursor = '';
  });

  it('registers browser event services and starts animation loop on mount', () => {
    const addWindowSpy = vi.spyOn(window, 'addEventListener');
    const addDocumentSpy = vi.spyOn(document, 'addEventListener');
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    render(<AnimatedCursor />);

    expect(addWindowSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addDocumentSpy).toHaveBeenCalledWith('mouseover', expect.any(Function));
    expect(addDocumentSpy).toHaveBeenCalledWith('mouseout', expect.any(Function));
    expect(rafSpy).toHaveBeenCalled();
  });

  it('removes all registered services and cancels animation frame on unmount', () => {
    const removeWindowSpy = vi.spyOn(window, 'removeEventListener');
    const removeDocumentSpy = vi.spyOn(document, 'removeEventListener');
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const { unmount } = render(<AnimatedCursor />);

    unmount();

    expect(removeWindowSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeDocumentSpy).toHaveBeenCalledWith('mouseover', expect.any(Function));
    expect(removeDocumentSpy).toHaveBeenCalledWith('mouseout', expect.any(Function));
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('processes mouse events through the mocked animation service', () => {
    let frameCallback: FrameRequestCallback | undefined;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      frameCallback = cb;
      return 1;
    });

    const { container } = render(<AnimatedCursor />);

    const layers = container.querySelectorAll('div');
    const dot = layers[0] as HTMLDivElement;

    fireEvent.mouseMove(window, {
      clientX: 120,
      clientY: 220,
    });

    expect(dot.style.transform).toBe('translate(116px, 216px)');

    frameCallback?.(0);

    expect(container).toBeInTheDocument();
  });

  it('uses mocked pointer capability service before enabling custom cursor behavior', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
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

  it('handles hover service transitions correctly for interactive targets', () => {
    let frameCallback: FrameRequestCallback | undefined;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      frameCallback = cb;
      return 1;
    });

    const { container } = render(
      <div>
        <button data-testid="hover-btn">Hover Me</button>
        <AnimatedCursor />
      </div>
    );

    const button = container.querySelector('[data-testid="hover-btn"]') as HTMLButtonElement;

    const cursorLayers = container.querySelectorAll('div');
    const ring = cursorLayers[cursorLayers.length - 1] as HTMLDivElement;

    fireEvent.mouseOver(button);

    frameCallback?.(0);

    expect(ring.style.borderColor).toBe('rgb(88, 166, 255)');
    expect(ring.style.background).toBe('rgba(88, 166, 255, 0.08)');
    expect(ring.style.width).toBe('40px');
    expect(ring.style.height).toBe('40px');

    fireEvent.mouseOut(button);

    frameCallback?.(0);

    expect(ring.style.borderColor).toBe('rgba(88, 166, 255, 0.5)');
    expect(ring.style.background).toBe('transparent');
    expect(ring.style.width).toBe('24px');
    expect(ring.style.height).toBe('24px');
  });
});
