import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import CherryBlossom from './CherryBlossom';
import type React from 'react';
import '@testing-library/jest-dom';

// Mock framer-motion to keep the tests simple and stable
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe('CherryBlossom - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies pointer-events-none class is present on the root container for hover and click transparency', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('pointer-events-none');
    });
  });

  it('verifies click events propagate/bubble up through the background overlay layer without blockage', async () => {
    const clickHandler = vi.fn();

    // Render CherryBlossom inside a parent container that listens for click events
    const { container } = render(
      <div onClick={clickHandler} data-testid="parent-container">
        <CherryBlossom />
      </div>
    );

    await waitFor(() => {
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();

      // Trigger a click directly on the overlay element
      fireEvent.click(overlay!);

      // Click should bubble up to the parent wrapper
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });

  it('verifies touch events propagate/bubble up through the background overlay layer to support touch gestures underneath', async () => {
    const touchStartHandler = vi.fn();

    const { container } = render(
      <div onTouchStart={touchStartHandler}>
        <CherryBlossom />
      </div>
    );

    await waitFor(() => {
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();

      // Trigger a touchstart event directly on the overlay
      fireEvent.touchStart(overlay!);

      // TouchStart should bubble up to the parent wrapper
      expect(touchStartHandler).toHaveBeenCalledTimes(1);
    });
  });

  it('verifies mouse hover events propagate/bubble up through the overlay without intercepting cursor actions', async () => {
    const mouseOverHandler = vi.fn();

    const { container } = render(
      <div onMouseOver={mouseOverHandler}>
        <CherryBlossom />
      </div>
    );

    await waitFor(() => {
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();

      // Trigger mouseover on the overlay
      fireEvent.mouseOver(overlay!);

      // Hover event should bubble up to the parent wrapper
      expect(mouseOverHandler).toHaveBeenCalledTimes(1);
    });
  });

  it('verifies no focus traps or tab-index tags exist to ensure zero keyboard navigation blockage', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      // Find all focusable elements or elements with custom tabIndex inside the CherryBlossom layout
      const focusable = container.querySelectorAll(
        '[tabIndex], button, a, input, select, textarea'
      );
      expect(focusable).toHaveLength(0);
    });
  });
});
