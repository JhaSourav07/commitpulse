import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

function InteractiveTooltip() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const debouncedHovered = useDebounce(hovered, 300);

  return (
    <div>
      <button
        data-testid="interactive-node"
        className={hovered ? 'cursor-pointer' : ''}
        onMouseEnter={(event) => {
          setHovered(true);
          setCoords({ x: event.clientX, y: event.clientY });
        }}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setClicked(true)}
        onTouchStart={() => setClicked(true)}
      >
        Hover target
      </button>

      {debouncedHovered && (
        <div role="tooltip" data-x={coords.x} data-y={coords.y}>
          Tooltip at {coords.x}, {coords.y}
        </div>
      )}

      {clicked && <span>Interaction received</span>}
    </div>
  );
}

describe('useDebounce mouse interactivity', () => {
  it('shows tooltip after mouseenter debounce delay', () => {
    vi.useFakeTimers();

    try {
      render(<InteractiveTooltip />);
      const target = screen.getByTestId('interactive-node');

      fireEvent.mouseEnter(target, { clientX: 120, clientY: 80 });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('displays tooltip at computed mouse coordinates', () => {
    vi.useFakeTimers();

    try {
      render(<InteractiveTooltip />);
      const target = screen.getByTestId('interactive-node');

      fireEvent.mouseEnter(target, { clientX: 150, clientY: 90 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const tooltip = screen.getByRole('tooltip');

      expect(tooltip).toHaveAttribute('data-x', '150');
      expect(tooltip).toHaveAttribute('data-y', '90');
      expect(tooltip).toHaveTextContent('Tooltip at 150, 90');
    } finally {
      vi.useRealTimers();
    }
  });

  it('propagates click interactions correctly', () => {
    render(<InteractiveTooltip />);

    fireEvent.click(screen.getByTestId('interactive-node'));

    expect(screen.getByText('Interaction received')).toBeInTheDocument();
  });

  it('applies pointer cursor class on hover', () => {
    render(<InteractiveTooltip />);
    const target = screen.getByTestId('interactive-node');

    fireEvent.mouseEnter(target);

    expect(target).toHaveClass('cursor-pointer');
  });

  it('hides temporary tooltip overlay after mouseleave debounce delay', () => {
    vi.useFakeTimers();

    try {
      render(<InteractiveTooltip />);
      const target = screen.getByTestId('interactive-node');

      fireEvent.mouseEnter(target);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(target);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
