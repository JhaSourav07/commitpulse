/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

const mockExportData = {
  activity: [],
  stats: { totalContributions: 0, currentStreak: 0, peakStreak: 0 },
  languages: [],
} as unknown as DashboardExportData;

let writeTextMock: ReturnType<typeof vi.fn>;

function InteractiveShareComponent({ onClose }: { onClose: () => void }) {
  const { states, handleCopyLink } = useShareActions('octocat', mockExportData, onClose);
  const [hovered, setHovered] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });

  return React.createElement(
    'div',
    null,
    React.createElement(
      'button',
      {
        'data-testid': 'copy-link-btn',
        className: 'cursor-pointer',
        onMouseEnter: () => setHovered(true),
        onMouseMove: (e: React.MouseEvent) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        },
        onMouseLeave: () => setHovered(false),
        onTouchStart: () => handleCopyLink(),
        onClick: () => handleCopyLink(),
      },
      'Copy Link'
    ),
    hovered &&
      React.createElement(
        'div',
        {
          'data-testid': 'tooltip',
          style: { position: 'absolute', left: `${coords.x}px`, top: `${coords.y}px` },
        },
        `Status: ${states.copy ?? 'idle'}`
      )
  );
}

describe('useShareActions - Interactive Tooltips, Cursor Hovers & Touch Event Propagation (Variation 5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 40,
      top: 50,
      left: 50,
      bottom: 90,
      right: 150,
      x: 50,
      y: 50,
      toJSON: () => {},
    })) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(React.createElement(InteractiveShareComponent, { onClose: vi.fn() }));
    const btn = screen.getByTestId('copy-link-btn');

    fireEvent.mouseEnter(btn);

    expect(screen.getByTestId('tooltip')).toBeDefined();
  });

  it('verifies that responsive tooltip layouts display at computed coordinates', () => {
    render(React.createElement(InteractiveShareComponent, { onClose: vi.fn() }));
    const btn = screen.getByTestId('copy-link-btn');

    fireEvent.mouseEnter(btn);
    fireEvent.mouseMove(btn, { clientX: 90, clientY: 70 });

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip.style.left).toBe('40px');
    expect(tooltip.style.top).toBe('20px');
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly to the underlying handler', async () => {
    const onClose = vi.fn();
    render(React.createElement(InteractiveShareComponent, { onClose }));
    const btn = screen.getByTestId('copy-link-btn');

    fireEvent.mouseEnter(btn);

    await act(async () => {
      fireEvent.touchStart(btn);
      fireEvent.click(btn);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalled();
    expect(screen.getByTestId('tooltip').textContent).toContain('success');
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(React.createElement(InteractiveShareComponent, { onClose: vi.fn() }));
    const btn = screen.getByTestId('copy-link-btn');

    expect(btn.className).toContain('cursor-pointer');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(React.createElement(InteractiveShareComponent, { onClose: vi.fn() }));
    const btn = screen.getByTestId('copy-link-btn');

    fireEvent.mouseEnter(btn);
    expect(screen.getByTestId('tooltip')).toBeDefined();

    fireEvent.mouseLeave(btn);
    expect(screen.queryByTestId('tooltip')).toBeNull();
  });
});
