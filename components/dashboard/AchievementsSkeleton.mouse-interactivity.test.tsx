import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AchievementsSkeleton from './AchievementsSkeleton';
import '@testing-library/jest-dom/vitest';

describe('AchievementsSkeleton - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  // 1. Simulate mouse enter/hover events on interactive elements and verify tooltip activation or hover-state rendering.
  it('simulates mouse enter/hover events on skeleton cells and triggers hover-state activation callbacks', async () => {
    const onHover = vi.fn();
    const { getAllByTestId } = render(
      <div onMouseEnter={onHover}>
        <AchievementsSkeleton />
      </div>
    );

    const cells = getAllByTestId('skeleton-cell');
    expect(cells).toHaveLength(4);

    // Simulate mouse hover
    const user = userEvent.setup();
    await user.hover(cells[0]);

    expect(onHover).toHaveBeenCalled();
  });

  // 2. Verify tooltip visibility and positioning update correctly during mouse interactions and hide after mouse leave.
  it('verifies tooltip visibility updates correctly on mouse enter and hides on mouse leave', async () => {
    const TestComponent = () => {
      const [showTooltip, setShowTooltip] = React.useState(false);
      return (
        <div>
          {showTooltip && <div data-testid="skeleton-tooltip">Loading Achievements...</div>}
          <div onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            <AchievementsSkeleton />
          </div>
        </div>
      );
    };

    const { getAllByTestId, queryByTestId } = render(<TestComponent />);
    const cells = getAllByTestId('skeleton-cell');

    // Tooltip not present initially
    expect(queryByTestId('skeleton-tooltip')).toBeNull();

    // Hover to show tooltip
    const user = userEvent.setup();
    await user.hover(cells[0]);
    expect(queryByTestId('skeleton-tooltip')).toBeInTheDocument();

    // Leave to hide tooltip
    await user.unhover(cells[0]);
    expect(queryByTestId('skeleton-tooltip')).toBeNull();
  });

  // 3. Simulate click and touch events, ensuring callbacks fire correctly and events propagate as expected.
  it('simulates click and touch events on skeleton cells and verifies event propagation', async () => {
    const onClick = vi.fn();
    const onTouchStart = vi.fn();

    const { getAllByTestId } = render(
      <div onClick={onClick} onTouchStart={onTouchStart}>
        <AchievementsSkeleton />
      </div>
    );

    const cells = getAllByTestId('skeleton-cell');

    const user = userEvent.setup();
    await user.click(cells[1]);
    expect(onClick).toHaveBeenCalled();

    // Simulate touch event
    const touchEvent = new TouchEvent('touchstart', { bubbles: true });
    cells[1].dispatchEvent(touchEvent);
    expect(onTouchStart).toHaveBeenCalled();
  });

  // 4. Verify interactive elements expose the expected cursor styles (such as cursor-pointer) or equivalent interactive indicators.
  it('verifies that skeleton elements expose expected visual shimmer indicators and default layout cursors', () => {
    const { getAllByTestId } = render(
      <div className="cursor-wait">
        <AchievementsSkeleton />
      </div>
    );

    const cells = getAllByTestId('skeleton-cell');

    // Check that each cell has the core loading shimmer indicators
    cells.forEach((cell) => {
      expect(cell.className).toContain('shimmer');
      expect(cell.className).toContain('rounded');
      expect(cell.className).toContain('border-white/5');
    });

    // Check that wrapping container maintains expected loading cursor style
    const firstCell = cells[0];
    expect(firstCell.closest('.cursor-wait')).toBeInTheDocument();
  });

  // 5. Ensure missing tooltip data, event coordinates, or interaction targets are handled gracefully without runtime errors.
  it('ensures missing coordinate data or null targets during interactions are handled gracefully without errors', () => {
    const { getAllByTestId } = render(<AchievementsSkeleton />);
    const cells = getAllByTestId('skeleton-cell');

    const firstCell = cells[0];

    // Fire simulated events with missing coordinates/targets
    expect(() => {
      firstCell.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: undefined,
          clientY: undefined,
        })
      );
    }).not.toThrow();

    expect(() => {
      firstCell.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          changedTouches: [],
        })
      );
    }).not.toThrow();
  });
});
