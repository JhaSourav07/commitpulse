import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import InteractiveViewer from './InteractiveViewer';

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
});
