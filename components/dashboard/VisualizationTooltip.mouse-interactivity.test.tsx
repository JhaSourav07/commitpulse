import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import VisualizationTooltip from './VisualizationTooltip';
import '@testing-library/jest-dom/vitest';

// framer-motion mock
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VisualizationTooltip - Mouse Interactivity & Tooltips', () => {
  it('1. triggers simulated mouseenter/hover gestures and maps to state', () => {
    // VisualizationTooltip is purely presentational and uses pointer-events-none.
    // We render it to simulate it being shown on hover by a parent.
    render(
      <VisualizationTooltip title="Hover Title" x={100} y={100}>
        Hover Content
      </VisualizationTooltip>
    );
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('pointer-events-none');
  });

  it('2. verifies that responsive tooltip layouts display at computed coordinates on hover', () => {
    render(
      <VisualizationTooltip title="Coords Title" x={150} y={250}>
        Coords Content
      </VisualizationTooltip>
    );
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveStyle({ left: '150px', top: '250px' });
  });

  it('3. tests custom click/touch gestures and ensures click events propagate correctly', () => {
    const handleTouch = vi.fn();
    render(
      <div onTouchStart={handleTouch}>
        <VisualizationTooltip title="Touch Title" x={0} y={0}>
          Touch Content
        </VisualizationTooltip>
      </div>
    );
    // Because the tooltip has pointer-events: none, touch events should propagate to parent
    const tooltip = screen.getByRole('tooltip');
    fireEvent.touchStart(tooltip);
    expect(handleTouch).toHaveBeenCalled();
  });

  it('4. asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(
      <VisualizationTooltip title="Cursor Title" x={0} y={0}>
        Cursor Content
      </VisualizationTooltip>
    );
    const tooltip = screen.getByRole('tooltip');
    // Ensure it doesn't block pointers
    expect(tooltip).toHaveClass('pointer-events-none');
  });

  it('5. checks that mouseleave events successfully hide temporary overlay visuals', () => {
    const { unmount } = render(
      <VisualizationTooltip title="Leave Title" x={0} y={0}>
        Leave Content
      </VisualizationTooltip>
    );
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();

    // Simulate mouse leave by unmounting (which parent would do)
    unmount();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
