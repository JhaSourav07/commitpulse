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
  // ── Existing behaviour ────────────────────────────────────────────────────

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

    // Focus and press 'w' to pan up
    fireEvent.keyDown(viewerContainer, { key: 'w' });

    // The content div is the second child (after the parallax layer)
    const contentDiv = viewerContainer.children[1] as HTMLElement;
    expect(contentDiv.style.transform).toContain('translate(0px, 30px) scale(1)');
  });

  it('handles keyboard navigation for zooming', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;

    // Focus and press '+' to zoom in
    fireEvent.keyDown(viewerContainer, { key: '+' });

    const contentDiv = viewerContainer.children[1] as HTMLElement;
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

    // The viewer container is grandparent: input → content div → viewer
    const viewerContainer = input.parentElement?.parentElement as HTMLElement;
    fireEvent.keyDown(viewerContainer, { key: 'w' });

    const contentDiv = viewerContainer.children[1] as HTMLElement;
    // Should not have panned since an input had focus
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  // ── Parallax background layer ─────────────────────────────────────────────

  it('renders the parallax background layer behind the card content', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    // The parallax layer is always present in the DOM (opacity transitions handle visibility)
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

    // Before hover: glow opacity should be 0 (faded out)
    expect(glow.style.opacity).toBe('0');

    // Simulate pointer entering the container
    fireEvent.pointerEnter(viewerContainer);

    // After hover: glow should become visible (opacity 1)
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
    // Glow should fade back out on leave
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

    // Move pointer to top-left quadrant of the mocked 600×400 container
    fireEvent.pointerMove(viewerContainer, { clientX: 150, clientY: 100 });

    // Normalized: x = 150/600 = 0.25, y = 100/400 = 0.25
    // Glow `left` should be "25%" and `top` should be "25%"
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

    // Move pointer to an off-center position
    fireEvent.pointerMove(viewerContainer, { clientX: 60, clientY: 80 });
    expect(glow.style.left).not.toBe('50%');

    // Leave the container — position resets to center so it fades from center
    fireEvent.pointerLeave(viewerContainer);
    expect(glow.style.left).toBe('50%');
    expect(glow.style.top).toBe('50%');
  });

  // ── Parallax Particles Tests ──────────────────────────────────────────────
  it('renders exactly 20 parallax particles with correct shapes, colors, and shadows', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    const parallaxBg = screen.getByTestId('parallax-bg-layer');
    const particles = Array.from(parallaxBg.children).slice(2) as HTMLElement[];
    expect(particles).toHaveLength(20);

    // Verify some are circles and some are rounded squares
    const circles = particles.filter((p) => p.style.borderRadius === '50%');
    const squares = particles.filter((p) => p.style.borderRadius === '2px');
    expect(circles.length).toBeGreaterThan(0);
    expect(squares.length).toBeGreaterThan(0);
    expect(circles.length + squares.length).toBe(20);

    // Verify that every particle has a background color, size, and shadow with color
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

    // Get initial opacities
    const initialOpacities = particles.map((p) => parseFloat(p.style.opacity));

    // Simulate pointer hover
    fireEvent.pointerEnter(viewerContainer);

    // Get hovering opacities
    const hoveringOpacities = particles.map((p) => parseFloat(p.style.opacity));

    // Every particle opacity should have increased (isHovering ? particle.opacity * 1.8 : particle.opacity)
    hoveringOpacities.forEach((op, index) => {
      expect(op).toBeCloseTo(initialOpacities[index] * 1.8, 5);
    });
  });

  // ── Pointer Drag-to-Pan Tests ──────────────────────────────────────────────
  it('updates pan offset when dragging with pointer movements', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Initially transform should be translate(0px, 0px) scale(1)
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    // pointerDown sets pointer capture
    const setPointerCaptureSpy = vi.spyOn(viewerContainer, 'setPointerCapture');
    fireEvent.pointerDown(viewerContainer, { pointerId: 42, clientX: 100, clientY: 100 });
    expect(setPointerCaptureSpy).toHaveBeenCalledWith(42);

    // pointerMove by dx=50, dy=30
    fireEvent.pointerMove(viewerContainer, { pointerId: 42, clientX: 150, clientY: 130 });
    expect(contentDiv.style.transform).toContain('translate(50px, 30px) scale(1)');

    // pointerMove by dx=-20, dy=-10
    fireEvent.pointerMove(viewerContainer, { pointerId: 42, clientX: 130, clientY: 120 });
    expect(contentDiv.style.transform).toContain('translate(30px, 20px) scale(1)');

    // pointerUp releases capture
    const releasePointerCaptureSpy = vi.spyOn(viewerContainer, 'releasePointerCapture');
    fireEvent.pointerUp(viewerContainer, { pointerId: 42 });
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(42);

    // Moving pointer after pointerUp should NOT change pan offset
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
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Down
    fireEvent.pointerDown(viewerContainer, { pointerId: 1, clientX: 100, clientY: 100 });
    // Move
    fireEvent.pointerMove(viewerContainer, { pointerId: 1, clientX: 120, clientY: 120 });
    expect(contentDiv.style.transform).toContain('translate(20px, 20px) scale(1)');

    // Cancel
    fireEvent.pointerCancel(viewerContainer, { pointerId: 1 });

    // Move again
    fireEvent.pointerMove(viewerContainer, { pointerId: 1, clientX: 150, clientY: 150 });
    expect(contentDiv.style.transform).toContain('translate(20px, 20px) scale(1)');
  });

  it('shows a tooltip with the formatted date when hovering a tower and updates it across towers', () => {
    render(
      <InteractiveViewer>
        <div
          className="interactive-tower"
          data-date="2025-06-15"
          data-count="42"
          data-metric="commits"
          data-testid="tower-a"
        >
          Tower A
        </div>
        <div
          className="interactive-tower"
          data-date="2025-01-01"
          data-count="7"
          data-metric="commits"
          data-testid="tower-b"
        >
          Tower B
        </div>
      </InteractiveViewer>
    );

    fireEvent.pointerMove(screen.getByTestId('tower-a'), { clientX: 100, clientY: 100 });
    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(screen.getByText('Jun 15, 2025')).toBeTruthy();

    fireEvent.pointerMove(screen.getByTestId('tower-b'), { clientX: 200, clientY: 100 });
    expect(screen.getByText('Jan 1, 2025')).toBeTruthy();
    expect(screen.queryByText('Jun 15, 2025')).toBeNull();
  });

  it('updates mousePos and particle shifts on pointerMove when not dragging', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = viewerContainer.children[1] as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    // Drag-free pointer move to (300, 200) -> normalized x=0.5, y=0.5
    fireEvent.pointerMove(viewerContainer, { clientX: 300, clientY: 200 });
    expect(glow.style.left).toBe('50%');
    expect(glow.style.top).toBe('50%');
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    // Move to (150, 300) -> x=0.25, y=0.75
    fireEvent.pointerMove(viewerContainer, { clientX: 150, clientY: 300 });
    expect(glow.style.left).toBe('25%');
    expect(glow.style.top).toBe('75%');
    // Content div translation should remain unaffected (since not dragging)
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  // ── Wheel Event Zooming Tests ──────────────────────────────────────────────
  it('zooms in/out via wheel event when ctrlKey or metaKey is active', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Zoom in with ctrlKey
    fireEvent.wheel(viewerContainer, { deltaY: -50, ctrlKey: true });
    expect(contentDiv.style.transform).toContain('scale(1.1)');

    // Zoom out with metaKey
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
    const contentDiv = viewerContainer.children[1] as HTMLElement;

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
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Zoom in repeatedly past 3.0
    for (let i = 0; i < 30; i++) {
      fireEvent.wheel(viewerContainer, { deltaY: -10, ctrlKey: true });
    }
    // Limit is 3
    expect(contentDiv.style.transform).toContain('scale(3)');

    // Zoom out repeatedly past 0.5
    for (let i = 0; i < 40; i++) {
      fireEvent.wheel(viewerContainer, { deltaY: 10, ctrlKey: true });
    }
    // Limit is 0.5
    expect(contentDiv.style.transform).toContain('scale(0.5)');
  });

  // ── Keyboard Interaction Tests ─────────────────────────────────────────────
  it('handles all panning keyboard directions', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Arrow keys
    fireEvent.keyDown(viewerContainer, { key: 'ArrowUp' }); // pan.y = 30
    fireEvent.keyDown(viewerContainer, { key: 'ArrowDown' }); // pan.y = 0
    fireEvent.keyDown(viewerContainer, { key: 'ArrowLeft' }); // pan.x = 30
    fireEvent.keyDown(viewerContainer, { key: 'ArrowRight' }); // pan.x = 0
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    // WASD uppercase & lowercase
    fireEvent.keyDown(viewerContainer, { key: 'W' }); // pan.y = 30
    fireEvent.keyDown(viewerContainer, { key: 'A' }); // pan.x = 30
    fireEvent.keyDown(viewerContainer, { key: 's' }); // pan.y = 0
    fireEvent.keyDown(viewerContainer, { key: 'd' }); // pan.x = 0
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  it('handles zoom key combinations and boundary clamping', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Zoom in with '='
    fireEvent.keyDown(viewerContainer, { key: '=' });
    expect(contentDiv.style.transform).toContain('scale(1.1)');

    // Zoom out with '_'
    fireEvent.keyDown(viewerContainer, { key: '_' });
    expect(contentDiv.style.transform).toContain('scale(1)');

    // Zoom out with '-' below limit
    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(viewerContainer, { key: '-' });
    }
    expect(contentDiv.style.transform).toContain('scale(0.5)');

    // Zoom in with '+' above limit
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
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    // Pan and zoom away from center
    fireEvent.keyDown(viewerContainer, { key: 'w' }); // pan.y = 30
    fireEvent.keyDown(viewerContainer, { key: 'a' }); // pan.x = 30
    fireEvent.keyDown(viewerContainer, { key: '+' }); // zoom = 1.1
    expect(contentDiv.style.transform).toContain('translate(30px, 30px) scale(1.1)');

    // Reset with 'r'
    fireEvent.keyDown(viewerContainer, { key: 'r' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');

    // Pan and zoom away again
    fireEvent.keyDown(viewerContainer, { key: 's' }); // pan.y = -30
    fireEvent.keyDown(viewerContainer, { key: 'd' }); // pan.x = -30
    fireEvent.keyDown(viewerContainer, { key: '-' }); // zoom = 0.9
    expect(contentDiv.style.transform).toContain('translate(-30px, -30px) scale(0.9)');

    // Reset with 'R'
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
    const contentDiv = viewerContainer.children[1] as HTMLElement;

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
    const contentDiv = viewerContainer.children[1] as HTMLElement;

    fireEvent.keyDown(viewerContainer, { key: 'w' });
    expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });

  // ── Responsive / Bounding Rect Tests ──────────────────────────────────────
  it('correctly normalizes mouse positions and scales parallax on varying container dimensions', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;
    const glow = screen.getByTestId('parallax-cursor-glow');

    // Scenario A: Mobile size container (300 x 200)
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

    // Hover at screen coordinates (75, 50)
    fireEvent.pointerMove(viewerContainer, { clientX: 75, clientY: 50 });
    // Normalized coordinates: x = 75/300 = 25% (0.25), y = 50/200 = 25% (0.25)
    expect(glow.style.left).toBe('25%');
    expect(glow.style.top).toBe('25%');

    // Scenario B: Large screen desktop container (1200 x 800)
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

    // Hover at screen coordinates (900, 200)
    fireEvent.pointerMove(viewerContainer, { clientX: 900, clientY: 200 });
    // Normalized coordinates: x = 900/1200 = 75% (0.75), y = 200/800 = 25% (0.25)
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

  // ── 3D Keyboard Rotation Tests ──────────────────────────────────────────────
  describe('3D mode keyboard rotation', () => {
    it('calls onRotate3D with arrow keys instead of panning in 3D mode', () => {
      const onRotate3D = vi.fn();
      const { container } = render(
        <InteractiveViewer is3DMode onRotate3D={onRotate3D}>
          <div>Content</div>
        </InteractiveViewer>
      );
      const viewerContainer = container.firstChild as HTMLElement;
      const contentDiv = viewerContainer.children[1] as HTMLElement;

      fireEvent.keyDown(viewerContainer, { key: 'ArrowUp' });
      expect(onRotate3D).toHaveBeenCalledWith(0, -10);

      fireEvent.keyDown(viewerContainer, { key: 'ArrowDown' });
      expect(onRotate3D).toHaveBeenCalledWith(0, 10);

      fireEvent.keyDown(viewerContainer, { key: 'ArrowLeft' });
      expect(onRotate3D).toHaveBeenCalledWith(-10, 0);

      fireEvent.keyDown(viewerContainer, { key: 'ArrowRight' });
      expect(onRotate3D).toHaveBeenCalledWith(10, 0);

      expect(onRotate3D).toHaveBeenCalledTimes(4);

      // Pan should NOT have changed — arrow keys went to rotation
      expect(contentDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
    });

    it('still pans with WASD keys even in 3D mode', () => {
      const onRotate3D = vi.fn();
      const { container } = render(
        <InteractiveViewer is3DMode onRotate3D={onRotate3D}>
          <div>Content</div>
        </InteractiveViewer>
      );
      const viewerContainer = container.firstChild as HTMLElement;
      const contentDiv = viewerContainer.children[1] as HTMLElement;

      fireEvent.keyDown(viewerContainer, { key: 'w' });
      expect(contentDiv.style.transform).toContain('translate(0px, 30px)');

      // onRotate3D should NOT have been called for WASD
      expect(onRotate3D).not.toHaveBeenCalled();
    });

    it('falls back to panning with arrow keys when not in 3D mode', () => {
      const { container } = render(
        <InteractiveViewer>
          <div>Content</div>
        </InteractiveViewer>
      );
      const viewerContainer = container.firstChild as HTMLElement;
      const contentDiv = viewerContainer.children[1] as HTMLElement;

      fireEvent.keyDown(viewerContainer, { key: 'ArrowUp' });
      expect(contentDiv.style.transform).toContain('translate(0px, 30px) scale(1)');
    });
  });

  // ── ARIA Label Tests ────────────────────────────────────────────────────────
  describe('aria-label accessibility', () => {
    it('sets the default aria-label for non-3D mode', () => {
      const { container } = render(
        <InteractiveViewer>
          <div>Content</div>
        </InteractiveViewer>
      );
      const viewerContainer = container.firstChild as HTMLElement;
      expect(viewerContainer.getAttribute('aria-label')).toBe(
        'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
      );
    });

    it('sets the 3D aria-label when is3DMode is true', () => {
      const { container } = render(
        <InteractiveViewer is3DMode>
          <div>Content</div>
        </InteractiveViewer>
      );
      const viewerContainer = container.firstChild as HTMLElement;
      expect(viewerContainer.getAttribute('aria-label')).toBe(
        'Interactive 3D viewer. Use Arrow keys to rotate, W A S D to pan, plus and minus to zoom, R to reset.'
      );
    });
  });
});
