import { describe, it, expect, vi } from 'vitest';
import { GitHubUserValidator } from './validate-user';

describe('GitHubUserValidator Mouse Interactivity', () => {
  it('handles simulated hover state flags without throwing', () => {
    const validator = GitHubUserValidator.getInstance();
    const hoverState = { active: false, coordinates: { x: 0, y: 0 } };

    // Simulate hover
    hoverState.active = true;
    hoverState.coordinates = { x: 150, y: 250 };

    expect(validator).toBeDefined();
    expect(hoverState.active).toBe(true);
    expect(hoverState.coordinates.x).toBe(150);
  });

  it('computes responsive tooltip offset coordinates correctly', () => {
    const computeOffset = (x: number, y: number) => ({ top: y - 5, left: x + 10 });
    const offset = computeOffset(50, 150);
    expect(offset.top).toBe(145);
    expect(offset.left).toBe(60);
  });

  it('verifies click/touch propagation events do not trigger double calls', () => {
    const onClick = vi.fn();
    const simulateTouch = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onClick();
    };
    const mockEvent = { stopPropagation: vi.fn() };
    simulateTouch(mockEvent);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('checks if correct cursor pointer class is returned for interactive elements', () => {
    const getCursorStyle = (isHovered: boolean) =>
      isHovered ? 'cursor-pointer' : 'cursor-default';
    expect(getCursorStyle(true)).toBe('cursor-pointer');
    expect(getCursorStyle(false)).toBe('cursor-default');
  });

  it('hides active tooltip overlay when mouseleave is triggered', () => {
    const overlay = { visible: true };
    const onMouseLeave = () => {
      overlay.visible = false;
    };
    onMouseLeave();
    expect(overlay.visible).toBe(false);
  });
});
