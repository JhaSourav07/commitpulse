import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import InteractiveViewer, { formatDate } from './InteractiveViewer';

// getBoundingClientRect is not implemented in jsdom — mock it so mouse-position
// tests can assert normalized values without relying on a real layout engine.
const mockContainerRect: DOMRect = {
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

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(mockContainerRect);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe('formatDate', () => {
  it('formats valid UTC date strings correctly', () => {
    expect(formatDate('2025-06-15')).toBe('Jun 15, 2025');
    expect(formatDate('2025-01-01')).toBe('Jan 1, 2025');
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });

  it('returns original string for malformed input', () => {
    expect(formatDate('2025-06')).toBe('2025-06');
    expect(formatDate('invalid-date-string')).toBe('invalid-date-string');
  });
});

describe('InteractiveViewer', () => {
  // ── Existing behaviour ────────────────────────────────────────────────────────

  it('renders children correctly', () => {
    render(
      <InteractiveViewer>
        <div data-testid="child">Test Child</div>
      </InteractiveViewer>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('handles keyboard navigation for panning', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: 'w' });

    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;
    expect(contentDiv.style.transform).toContain('translate(0px, 30px) scale(1)');
  });

  it('handles keyboard navigation for zooming', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: '+' });

    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;
    expect(contentDiv.style.transform).toContain('scale(1.1)');
  });

  it('ignores key presses if an input element is focused', () => {
    render(
      <InteractiveViewer>
        <input data-testid="input" />
      </InteractiveViewer>
    );

    const input = screen.getByTestId('input');
    input.focus();

    const viewerContainer = input.parentElement?.parentElement as HTMLElement;
    fireEvent.keyDown(viewerContainer, { key: 'w' });

    const contentDiv = viewerContainer.querySelector(
      '[data-testid="viewer-content"]'
    ) as HTMLElement;
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  // ── Parallax background layer ─────────────────────────────────────────────────

  it('renders the parallax background layer behind the card content', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    expect(screen.getByTestId('parallax-bg-layer')).toBeDefined();
  });

  it('renders the cursor glow element inside the parallax layer', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const glow = screen.getByTestId('parallax-cursor-glow');
    expect(glow).toBeDefined();
  });

  it('shows the cursor glow at full opacity when the pointer enters the container', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    expect(glow.style.opacity).toBe('0');

    fireEvent.pointerEnter(viewerContainer);

    expect(glow.style.opacity).toBe('1');
  });

  it('hides the cursor glow when the pointer leaves the container', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    fireEvent.pointerEnter(viewerContainer);
    expect(glow.style.opacity).toBe('1');

    fireEvent.pointerLeave(viewerContainer);
    expect(glow.style.opacity).toBe('0');
  });

  it('updates the cursor glow position on pointer move', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    fireEvent.pointerMove(viewerContainer, { clientX: 150, clientY: 100 });

    expect(glow.style.left).toBe('25%');
    expect(glow.style.top).toBe('25%');
  });

  it('resets glow position to center (50%) when the pointer leaves', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    fireEvent.pointerMove(viewerContainer, { clientX: 60, clientY: 80 });
    expect(glow.style.left).not.toBe('50%');

    fireEvent.pointerLeave(viewerContainer);
    expect(glow.style.left).toBe('50%');
    expect(glow.style.top).toBe('50%');
  });

  // ── Parallax Particles Tests ──────────────────────────────────────────────────

  it('renders exactly 20 parallax particles with correct shapes, colors, and shadows', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    const parallaxBg = screen.getByTestId('parallax-bg-layer');
    const particles = Array.from(parallaxBg.children).slice(2) as HTMLElement[];
    expect(particles).toHaveLength(20);

    const circles = particles.filter((p) => p.style.borderRadius === '50%');
    const squares = particles.filter((p) => p.style.borderRadius === '2px');
    expect(circles.length).toBeGreaterThan(0);
    expect(squares.length).toBeGreaterThan(0);
    expect(circles.length + squares.length).toBe(20);

    particles.forEach((p) => {
      expect(p.style.backgroundColor).toBeTruthy();
      expect(p.style.width).toBeTruthy();
      expect(p.style.height).toBeTruthy();
      expect(p.style.boxShadow).toBeTruthy();
    });
  });

  it('increases particle opacity when the pointer is hovering', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const parallaxBg = screen.getByTestId('parallax-bg-layer');
    const particles = Array.from(parallaxBg.children).slice(2) as HTMLElement[];

    const initialOpacities = particles.map((p) => parseFloat(p.style.opacity));

    fireEvent.pointerEnter(viewerContainer);

    const hoveringOpacities = particles.map((p) => parseFloat(p.style.opacity));

    hoveringOpacities.forEach((op, index) => {
      expect(op).toBeCloseTo(initialOpacities[index] * 1.8, 5);
    });
  });

  // ── Pointer Drag-to-Pan Tests ─────────────────────────────────────────────────

  it('updates pan offset when dragging with pointer movements', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    const setPointerCaptureSpy = vi.spyOn(viewerContainer, 'setPointerCapture');
    fireEvent.pointerDown(viewerContainer, { pointerId: 42, clientX: 100, clientY: 100 });
    expect(setPointerCaptureSpy).toHaveBeenCalledWith(42);

    fireEvent.pointerMove(viewerContainer, { pointerId: 42, clientX: 150, clientY: 130 });
    expect(contentDiv.style.transform).toContain('translate(50px, 30px) scale(1)');

    fireEvent.pointerMove(viewerContainer, { pointerId: 42, clientX: 130, clientY: 120 });
    expect(contentDiv.style.transform).toContain('translate(30px, 20px) scale(1)');

    const releasePointerCaptureSpy = vi.spyOn(viewerContainer, 'releasePointerCapture');
    fireEvent.pointerUp(viewerContainer, { pointerId: 42 });
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(42);

    fireEvent.pointerMove(viewerContainer, { pointerId: 42, clientX: 200, clientY: 200 });
    expect(contentDiv.style.transform).toContain('translate(30px, 20px) scale(1)');
  });

  it('stops dragging on pointer cancel', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    fireEvent.pointerDown(viewerContainer, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(viewerContainer, { pointerId: 1, clientX: 120, clientY: 120 });
    expect(contentDiv.style.transform).toContain('translate(20px, 20px) scale(1)');

    fireEvent.pointerCancel(viewerContainer, { pointerId: 1 });

    fireEvent.pointerMove(viewerContainer, { pointerId: 1, clientX: 150, clientY: 150 });
    expect(contentDiv.style.transform).toContain('translate(20px, 20px) scale(1)');
  });

  it('updates mousePos and particle shifts on pointerMove when not dragging', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    fireEvent.pointerMove(viewerContainer, { clientX: 300, clientY: 200 });
    expect(glow.style.left).toBe('50%');
    expect(glow.style.top).toBe('50%');
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    fireEvent.pointerMove(viewerContainer, { clientX: 150, clientY: 300 });
    expect(glow.style.left).toBe('25%');
    expect(glow.style.top).toBe('75%');
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  // ── Wheel Event Zooming Tests ─────────────────────────────────────────────────

  it('zooms in/out via wheel event when ctrlKey or metaKey is active', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    fireEvent.wheel(viewerContainer, { deltaY: -50, ctrlKey: true });
    expect(contentDiv.style.transform).toContain('scale(1.1)');

    fireEvent.wheel(viewerContainer, { deltaY: 50, metaKey: true });
    expect(contentDiv.style.transform).toContain('scale(1)');
  });

  it('does not change zoom on wheel event if ctrlKey and metaKey are false', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    fireEvent.wheel(viewerContainer, { deltaY: -50 });
    expect(contentDiv.style.transform).toContain('scale(1)');
  });

  it('clamps zoom boundaries during wheel zooming', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    for (let i = 0; i < 30; i++) {
      fireEvent.wheel(viewerContainer, { deltaY: -10, ctrlKey: true });
    }
    expect(contentDiv.style.transform).toContain('scale(3)');

    for (let i = 0; i < 40; i++) {
      fireEvent.wheel(viewerContainer, { deltaY: 10, ctrlKey: true });
    }
    expect(contentDiv.style.transform).toContain('scale(0.5)');
  });

  // ── Keyboard Interaction Tests ────────────────────────────────────────────────

  it('handles all panning keyboard directions', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: 'ArrowUp' });
    fireEvent.keyDown(viewerContainer, { key: 'ArrowDown' });
    fireEvent.keyDown(viewerContainer, { key: 'ArrowLeft' });
    fireEvent.keyDown(viewerContainer, { key: 'ArrowRight' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    fireEvent.keyDown(viewerContainer, { key: 'W' });
    fireEvent.keyDown(viewerContainer, { key: 'A' });
    fireEvent.keyDown(viewerContainer, { key: 's' });
    fireEvent.keyDown(viewerContainer, { key: 'd' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  it('handles zoom key combinations and boundary clamping', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: '=' });
    expect(contentDiv.style.transform).toContain('scale(1.1)');

    fireEvent.keyDown(viewerContainer, { key: '_' });
    expect(contentDiv.style.transform).toContain('scale(1)');

    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(viewerContainer, { key: '-' });
    }
    expect(contentDiv.style.transform).toContain('scale(0.5)');

    for (let i = 0; i < 30; i++) {
      fireEvent.keyDown(viewerContainer, { key: '+' });
    }
    expect(contentDiv.style.transform).toContain('scale(3)');
  });

  it('resets pan and zoom when pressing r or R', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: 'w' });
    fireEvent.keyDown(viewerContainer, { key: 'a' });
    fireEvent.keyDown(viewerContainer, { key: '+' });
    expect(contentDiv.style.transform).toContain('translate(30px, 30px) scale(1.1)');

    fireEvent.keyDown(viewerContainer, { key: 'r' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    fireEvent.keyDown(viewerContainer, { key: 's' });
    fireEvent.keyDown(viewerContainer, { key: 'd' });
    fireEvent.keyDown(viewerContainer, { key: '-' });
    expect(contentDiv.style.transform).toContain('translate(-30px, -30px) scale(0.9)');

    fireEvent.keyDown(viewerContainer, { key: 'R' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  it('does not prevent default or update state for unmapped keys', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = container.querySelector('[data-testid="viewer-content"]') as HTMLElement;

    const unmappedEvent = { key: 'x', preventDefault: vi.fn() };
    fireEvent.keyDown(viewerContainer, unmappedEvent);
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
    expect(unmappedEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('ignores keys when a textarea or input is active', () => {
    render(
      <InteractiveViewer>
        <textarea data-testid="textarea" />
      </InteractiveViewer>
    );
    const textarea = screen.getByTestId('textarea');
    textarea.focus();

    const viewerContainer = textarea.parentElement?.parentElement as HTMLElement;
    const contentDiv = viewerContainer.querySelector(
      '[data-testid="viewer-content"]'
    ) as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: 'w' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  // ── Responsive / Bounding Rect Tests ─────────────────────────────────────────

  it('correctly normalizes mouse positions and scales parallax on varying container dimensions', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 300,
      bottom: 200,
      width: 300,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerMove(viewerContainer, { clientX: 75, clientY: 50 });
    expect(glow.style.left).toBe('25%');
    expect(glow.style.top).toBe('25%');

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1200,
      bottom: 800,
      width: 1200,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerMove(viewerContainer, { clientX: 900, clientY: 200 });
    expect(glow.style.left).toBe('75%');
    expect(glow.style.top).toBe('25%');
  });

  describe('InteractiveViewer responsive rendering', () => {
    afterEach(() => {
      window.innerWidth = 1024;
      window.innerHeight = 768;
    });

    const resizeWindow = (width: number, height: number) => {
      window.innerWidth = width;
      window.innerHeight = height;
      window.dispatchEvent(new Event('resize'));
    };

    it('renders correctly on mobile viewport', () => {
      resizeWindow(375, 667);

      render(
        <InteractiveViewer>
          <div data-testid="mobile-content">Mobile Content</div>
        </InteractiveViewer>
      );

      expect(screen.getByTestId('mobile-content')).toBeTruthy();
      expect(screen.getByTestId('parallax-bg-layer')).toBeTruthy();
    });

    it('renders correctly on desktop viewport with pointer interactions', () => {
      resizeWindow(1440, 900);

      render(
        <InteractiveViewer>
          <div data-testid="desktop-content">Desktop Content</div>
        </InteractiveViewer>
      );

      const glowLayer = screen.getByTestId('parallax-cursor-glow');

      fireEvent.pointerMove(glowLayer, {
        clientX: 100,
        clientY: 100,
      });

      expect(screen.getByTestId('desktop-content')).toBeTruthy();
      expect(glowLayer).toBeTruthy();
    });
  });
});
