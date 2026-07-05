import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import {
  formatTooltipDate,
  getContributionLabel,
  getActivityInsight,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';
import type { ActivityData } from '@/types/dashboard';

const mockData: ActivityData[] = [
  { date: '2024-02-28', count: 1, intensity: 1 },
  { date: '2024-02-29', count: 5, intensity: 3 },
  { date: '2024-03-01', count: 0, intensity: 0 },
];

const InteractiveTooltipTestComponent = ({ onClick }: { onClick: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setCoords({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setShowTooltip(true);
    if (e.touches[0]) {
      setCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  return React.createElement('div', { className: 'relative p-10', onClick }, [
    React.createElement(
      'div',
      {
        key: 'interactive-node',
        'data-testid': 'interactive-node',
        className: 'cursor-pointer p-4 bg-emerald-500 text-white rounded',
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
        onMouseMove: handleMouseMove,
        onTouchStart: handleTouchStart,
      },
      'Hover or Touch Me'
    ),
    showTooltip
      ? React.createElement(
          'div',
          {
            key: 'tooltip-overlay',
            'data-testid': 'tooltip-overlay',
            style: { position: 'absolute', left: `${coords.x}px`, top: `${coords.y}px` },
          },
          [
            React.createElement(
              'span',
              { key: 'date', 'data-testid': 'tooltip-date' },
              formatTooltipDate('2024-02-29')
            ),
            React.createElement(
              'span',
              { key: 'label', 'data-testid': 'tooltip-label' },
              getContributionLabel(5)
            ),
            React.createElement(
              'span',
              { key: 'insight', 'data-testid': 'tooltip-insight' },
              getActivityInsight(5, 3)
            ),
            React.createElement(
              'span',
              { key: 'streak', 'data-testid': 'tooltip-streak' },
              getStreakLabel(getLocalActiveStreak(mockData, 1))
            ),
          ]
        )
      : null,
  ]);
};

describe('tooltipUtils - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  const mockClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(React.createElement(InteractiveTooltipTestComponent, { onClick: mockClick }));

    const node = screen.getByTestId('interactive-node');
    expect(screen.queryByTestId('tooltip-overlay')).not.toBeInTheDocument();

    fireEvent.mouseEnter(node);

    expect(screen.getByTestId('tooltip-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-date')).toHaveTextContent('Feb 29, 2024');
    expect(screen.getByTestId('tooltip-label')).toHaveTextContent('5 contributions');
    expect(screen.getByTestId('tooltip-insight')).toHaveTextContent('High activity day');
    expect(screen.getByTestId('tooltip-streak')).toHaveTextContent('2-day active streak');
  });

  it('Case 2: verifies that responsive tooltip layouts display at computed coordinates', () => {
    render(React.createElement(InteractiveTooltipTestComponent, { onClick: mockClick }));

    const node = screen.getByTestId('interactive-node');
    fireEvent.mouseEnter(node);

    fireEvent.mouseMove(node, { clientX: 150, clientY: 300 });

    const overlay = screen.getByTestId('tooltip-overlay');
    expect(overlay).toHaveStyle('left: 150px');
    expect(overlay).toHaveStyle('top: 300px');
  });

  it('Case 3: tests custom click/touch gestures and ensure click events propagate correctly', () => {
    render(React.createElement(InteractiveTooltipTestComponent, { onClick: mockClick }));

    const node = screen.getByTestId('interactive-node');

    fireEvent.touchStart(node, {
      touches: [{ clientX: 95, clientY: 175 }],
    } as unknown as React.TouchEvent<HTMLDivElement>);

    const overlay = screen.getByTestId('tooltip-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveStyle('left: 95px');
    expect(overlay).toHaveStyle('top: 175px');

    fireEvent.click(node);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('Case 4: asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(React.createElement(InteractiveTooltipTestComponent, { onClick: mockClick }));

    const node = screen.getByTestId('interactive-node');
    expect(node).toHaveClass('cursor-pointer');
  });

  it('Case 5: checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(React.createElement(InteractiveTooltipTestComponent, { onClick: mockClick }));

    const node = screen.getByTestId('interactive-node');
    fireEvent.mouseEnter(node);
    expect(screen.getByTestId('tooltip-overlay')).toBeInTheDocument();

    fireEvent.mouseLeave(node);
    expect(screen.queryByTestId('tooltip-overlay')).not.toBeInTheDocument();
  });
});
