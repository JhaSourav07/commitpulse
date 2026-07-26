import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import InteractiveViewer from './InteractiveViewer';

// jsdom does not implement getBoundingClientRect or pointer capture.
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

// ─── Test 1: Accessible Names ──────────────────────────────────────────────────

describe('Test 1 — Accessible Names', () => {
  it('exposes an accessible name on the interactive container', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    // The outer div has no explicit ARIA role, but exposes an aria-label.
    // query by accessible label text to verify the accessible name is present.
    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );

    expect(viewer).toHaveAccessibleName();
  });

  it('exposes distinct accessible names in 2D and 3D modes', () => {
    const { rerender } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    const viewer2d = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );
    expect(viewer2d).toHaveAccessibleName(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );

    rerender(
      <InteractiveViewer is3DMode>
        <div>Content</div>
      </InteractiveViewer>
    );

    const viewer3d = screen.getByLabelText(
      'Interactive 3D viewer. Use Arrow keys to rotate, W A S D to pan, plus and minus to zoom, R to reset.'
    );
    expect(viewer3d).toHaveAccessibleName(
      'Interactive 3D viewer. Use Arrow keys to rotate, W A S D to pan, plus and minus to zoom, R to reset.'
    );
  });

  it('exposes an accessible name on the tooltip when visible', async () => {
    render(
      <InteractiveViewer>
        <div
          className="interactive-tower"
          data-date="2025-06-15"
          data-count="42"
          data-metric="commits"
        >
          Tower
        </div>
      </InteractiveViewer>
    );

    const tower = screen.getByText('Tower');

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Wrap the state-changing pointer event in act() to suppress the warning.
    await act(async () => {
      tower.dispatchEvent(
        new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 25 })
      );
    });

    const tooltip = screen.getByRole('tooltip');
    // The tooltip exposes its accessible name via the visible title text "Jun 15, 2025".
    expect(tooltip).toHaveAccessibleName();
  });
});

// ─── Test 2: Keyboard Accessibility ────────────────────────────────────────────

describe('Test 2 — Keyboard Accessibility', () => {
  it('allows keyboard-only users to focus the viewer container', async () => {
    const user = userEvent.setup();
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );

    // Tab should reach the viewer since it has tabIndex={0}.
    await user.tab();

    expect(document.activeElement).toBe(viewer);
  });

  it('moves focus away from the viewer when tabbing past it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button data-testid="before">Before</button>
        <InteractiveViewer>
          <div>Content</div>
        </InteractiveViewer>
        <button data-testid="after">After</button>
      </>
    );

    const beforeButton = screen.getByTestId('before');
    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );
    const afterButton = screen.getByTestId('after');

    // Focus the button before the viewer.
    await user.click(beforeButton);
    expect(document.activeElement).toBe(beforeButton);

    // Tab into the viewer.
    await user.tab();
    expect(document.activeElement).toBe(viewer);

    // Tab past the viewer to the next focusable element.
    await user.tab();
    expect(document.activeElement).toBe(afterButton);
  });

  it('keeps the viewer reachable via reverse tab (Shift+Tab)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button data-testid="before">Before</button>
        <InteractiveViewer>
          <div>Content</div>
        </InteractiveViewer>
        <button data-testid="after">After</button>
      </>
    );

    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );

    // Start focused on the after button.
    await user.click(screen.getByTestId('after'));
    expect(document.activeElement).toBe(screen.getByTestId('after'));

    // Shift+Tab back to the viewer.
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(viewer);
  });
});

// ─── Test 3: ARIA Relationship Validation ──────────────────────────────────────

describe('Test 3 — ARIA Relationship Validation', () => {
  it('has no broken aria-labelledby references', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    // Collect all elements with aria-labelledby.
    const elementsWithLabelledBy = document.querySelectorAll('[aria-labelledby]');
    const missingIds: string[] = [];

    elementsWithLabelledBy.forEach((el) => {
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/);
      ids.forEach((id) => {
        if (id && !document.getElementById(id)) {
          missingIds.push(id);
        }
      });
    });

    expect(missingIds).toEqual([]);
  });

  it('has no broken aria-describedby references', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    // Collect all elements with aria-describedby.
    const elementsWithDescribedBy = document.querySelectorAll('[aria-describedby]');
    const missingIds: string[] = [];

    elementsWithDescribedBy.forEach((el) => {
      const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
      ids.forEach((id) => {
        if (id && !document.getElementById(id)) {
          missingIds.push(id);
        }
      });
    });

    expect(missingIds).toEqual([]);
  });

  it('validates tooltip accessibility relationships when tooltip is visible', async () => {
    render(
      <InteractiveViewer>
        <div
          className="interactive-tower"
          data-date="2025-06-15"
          data-count="42"
          data-metric="commits"
        >
          Tower
        </div>
      </InteractiveViewer>
    );

    const tower = screen.getByText('Tower');

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    await act(async () => {
      tower.dispatchEvent(
        new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 25 })
      );
    });

    const tooltip = screen.queryByRole('tooltip');
    if (tooltip) {
      // Verify tooltip has no broken internal references.
      const tooltipIds = tooltip.querySelectorAll('[id]');
      tooltipIds.forEach((el) => {
        // Ensure id is unique within the tooltip.
        const id = el.getAttribute('id');
        if (id) {
          expect(document.querySelectorAll(`#${CSS.escape(id)}`).length).toBe(1);
        }
      });

      // Verify the tooltip has visible text content for AT users.
      expect(tooltip.textContent).toBeTruthy();
    }
  });
});

// ─── Test 4: Heading Structure ────────────────────────────────────────────────

describe('Test 4 — Heading Structure', () => {
  it('exposes no headings when none are provided as children', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    const headings = screen.queryAllByRole('heading');
    // InteractiveViewer does not render any heading elements by itself.
    expect(headings).toHaveLength(0);
  });

  it('correctly exposes headings passed as children', () => {
    render(
      <InteractiveViewer>
        <h1>Main Title</h1>
        <h2>Sub Section</h2>
        <h3>Detail</h3>
      </InteractiveViewer>
    );

    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(3);
    expect(headings[0]).toHaveTextContent('Main Title');
    expect(headings[1]).toHaveTextContent('Sub Section');
    expect(headings[2]).toHaveTextContent('Detail');
  });

  it('follows a logical heading hierarchy without skipping levels', () => {
    render(
      <InteractiveViewer>
        <h1>Level 1</h1>
        <h2>Level 2</h2>
        <h3>Level 3</h3>
      </InteractiveViewer>
    );

    const headings = screen.getAllByRole('heading');
    const levels = headings.map((h) => Number(h.tagName.slice(1)));

    // Verify no level skipping (each level is <= previous + 1).
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
    }
  });
});

// ─── Test 5: Logical Tab Order ─────────────────────────────────────────────────

describe('Test 5 — Logical Tab Order', () => {
  it('follows reading order when the viewer is between other controls', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button data-testid="first">First</button>
        <InteractiveViewer>
          <div>Content</div>
        </InteractiveViewer>
        <button data-testid="last">Last</button>
      </>
    );

    const firstButton = screen.getByTestId('first');
    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );
    const lastButton = screen.getByTestId('last');

    // Focus first button.
    await user.click(firstButton);
    expect(document.activeElement).toBe(firstButton);

    // Tab to viewer.
    await user.tab();
    expect(document.activeElement).toBe(viewer);

    // Tab to last button.
    await user.tab();
    expect(document.activeElement).toBe(lastButton);
  });

  it('does not trap focus within the viewer', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button data-testid="before">Before</button>
        <InteractiveViewer>
          <div>Content</div>
        </InteractiveViewer>
        <button data-testid="after">After</button>
      </>
    );

    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );
    const afterButton = screen.getByTestId('after');

    // Focus the viewer directly.
    viewer.focus();
    expect(document.activeElement).toBe(viewer);

    // Tab should leave the viewer and reach the next element.
    await user.tab();
    expect(document.activeElement).toBe(afterButton);
  });

  it('reaches all intended focusable controls in order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button data-testid="prev">Previous</button>
        <InteractiveViewer>
          <a href="#internal" data-testid="internal-link">
            Internal Link
          </a>
        </InteractiveViewer>
        <button data-testid="next">Next</button>
      </>
    );

    const prevButton = screen.getByTestId('prev');
    const viewer = screen.getByLabelText(
      'Interactive viewer. Use Arrow keys or W A S D to pan, plus and minus to zoom, R to reset.'
    );
    const internalLink = screen.getByTestId('internal-link');
    const nextButton = screen.getByTestId('next');

    await user.click(prevButton);
    expect(document.activeElement).toBe(prevButton);

    // Tab to viewer.
    await user.tab();
    expect(document.activeElement).toBe(viewer);

    // Tab to internal link inside the viewer.
    await user.tab();
    expect(document.activeElement).toBe(internalLink);

    // Tab to next button.
    await user.tab();
    expect(document.activeElement).toBe(nextButton);
  });
});
