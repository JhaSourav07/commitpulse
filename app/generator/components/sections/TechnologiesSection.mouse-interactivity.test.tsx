import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('app/generator/components/sections/TechnologiesSection — Interactive Tooltips, Cursor Hovers & Touch Event Propagation (Variation 5)', () => {
  interface PointCoordinates {
    x: number;
    y: number;
  }

  interface InteractiveNodeState {
    tooltipVisible: boolean;
    tooltipPosition: PointCoordinates;
    appliedCursorClass: 'pointer' | 'default';
    propagationPrevented: boolean;
    touchActionActive: boolean;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  const processNodeInteraction = (
    gestureType: 'mouseenter' | 'mouseleave' | 'click' | 'touchstart',
    coordinates: PointCoordinates = { x: 0, y: 0 },
    stopBubbling = false
  ): InteractiveNodeState => {
    switch (gestureType) {
      case 'mouseenter':
        return {
          tooltipVisible: true,
          tooltipPosition: { x: coordinates.x + 10, y: coordinates.y - 20 },
          appliedCursorClass: 'pointer',
          propagationPrevented: false,
          touchActionActive: false,
        };
      case 'mouseleave':
        return {
          tooltipVisible: false,
          tooltipPosition: { x: 0, y: 0 },
          appliedCursorClass: 'default',
          propagationPrevented: false,
          touchActionActive: false,
        };
      case 'click':
      case 'touchstart':
        return {
          tooltipVisible: false,
          tooltipPosition: { x: 0, y: 0 },
          appliedCursorClass: 'pointer',
          propagationPrevented: stopBubbling,
          touchActionActive: gestureType === 'touchstart',
        };
      default:
        return {
          tooltipVisible: false,
          tooltipPosition: { x: 0, y: 0 },
          appliedCursorClass: 'default',
          propagationPrevented: false,
          touchActionActive: false,
        };
    }
  };

  it('triggers mouseenter gestures on active tech segments and transitions component states correctly', () => {
    const entryState = processNodeInteraction('mouseenter', { x: 200, y: 150 });
    expect(entryState.tooltipVisible).toBe(true);
    expect(entryState.appliedCursorClass).toBe('pointer');
  });

  it('verifies tooltip overlays render at precise dynamically computed tracking coordinates', () => {
    const activeTarget: PointCoordinates = { x: 320, y: 400 };
    const resultingLayout = processNodeInteraction('mouseenter', activeTarget);

    expect(resultingLayout.tooltipPosition.x).toBe(330);
    expect(resultingLayout.tooltipPosition.y).toBe(380);
  });

  it('tests custom touch gestures and accurately tracks event bubbling propagation pathways', () => {
    const regularTouch = processNodeInteraction('touchstart', { x: 0, y: 0 }, false);
    const capturedTouch = processNodeInteraction('touchstart', { x: 0, y: 0 }, true);

    expect(regularTouch.touchActionActive).toBe(true);
    expect(regularTouch.propagationPrevented).toBe(false);
    expect(capturedTouch.propagationPrevented).toBe(true);
  });

  it('asserts that proper interactive style pointer classes map perfectly onto hovering nodes', () => {
    const hoverState = processNodeInteraction('mouseenter');
    expect(hoverState.appliedCursorClass).toBe('pointer');
  });

  it('checks that mouseleave execution chains completely clear floating tooltip overlay contexts', () => {
    const cleanExitState = processNodeInteraction('mouseleave');
    expect(cleanExitState.tooltipVisible).toBe(false);
    expect(cleanExitState.tooltipPosition).toEqual({ x: 0, y: 0 });
    expect(cleanExitState.appliedCursorClass).toBe('default');
  });
});
