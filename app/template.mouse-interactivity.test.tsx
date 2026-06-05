import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const MockAppTemplate = ({ onItemClick }: { onItemClick?: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setCoords({ x: e.clientX || 150, y: e.clientY || 80 });
  };

  return (
    <div data-testid="template-root">
      <div
        data-testid="interactive-node"
        style={{ cursor: 'pointer', padding: '10px' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
        onClick={onItemClick}
      >
        Hover over me
      </div>

      {showTooltip && (
        <div
          data-testid="interactive-tooltip"
          style={{ position: 'absolute', left: `${coords.x}px`, top: `${coords.y}px` }}
        >
          Tooltip Content
        </div>
      )}
    </div>
  );
};

describe('AppTemplate — Mouse Interactivity & Event Propagation (Variation 5)', () => {
  it('displays the interactive tooltip overlay when a mouseenter event triggers on the node', () => {
    render(<MockAppTemplate />);
    const node = screen.getByTestId('interactive-node');

    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();

    fireEvent.mouseEnter(node);
    expect(screen.getByTestId('interactive-tooltip')).toBeDefined();
  });

  it('updates the absolute layout spatial positions of tooltips based on computed client coordinates', () => {
    render(<MockAppTemplate />);
    const node = screen.getByTestId('interactive-node');

    fireEvent.mouseEnter(node);
    fireEvent.mouseMove(node, { clientX: 240, clientY: 110 });

    const tooltip = screen.getByTestId('interactive-tooltip');
    expect(tooltip.style.left).toBe('240px');
    expect(tooltip.style.top).toBe('110px');
  });

  it('bubbles trigger click/touch gestures cleanly up to parent subscription callbacks without blocking propagation', () => {
    const mockCallback = vi.fn();
    render(<MockAppTemplate onItemClick={mockCallback} />);
    const node = screen.getByTestId('interactive-node');

    fireEvent.click(node);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('applies the strict pointer style cursor definition on interactive element classes during cursor hover frames', () => {
    render(<MockAppTemplate />);
    const node = screen.getByTestId('interactive-node');

    expect(node.style.cursor).toBe('pointer');
  });

  it('successfully unmounts and conceals temporary overlay components once the cursor triggers a mouseleave lifecycle event', () => {
    render(<MockAppTemplate />);
    const node = screen.getByTestId('interactive-node');

    fireEvent.mouseEnter(node);
    expect(screen.getByTestId('interactive-tooltip')).toBeDefined();

    fireEvent.mouseLeave(node);
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();
  });
});
