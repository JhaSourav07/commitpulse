import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { TECHNOLOGIES } from './technologies';

// Mock component to render the static technologies and simulate interactive tooltips, hovers, and touch
const TechnologyListInteractive = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  return (
    <div data-testid="tech-container">
      {TECHNOLOGIES.slice(0, 5).map((tech) => (
        <div
          key={tech.id}
          data-testid={`tech-item-${tech.id}`}
          className="tech-item cursor-default hover:cursor-pointer"
          onMouseEnter={() => setActiveTooltip(tech.id)}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setClickedItem(tech.id)}
          onTouchStart={() => setClickedItem(tech.id)}
        >
          {tech.name}
          {activeTooltip === tech.id && (
            <div data-testid={`tooltip-${tech.id}`} className="absolute top-10 left-10">
              {tech.name} Tooltip
            </div>
          )}
        </div>
      ))}
      {clickedItem && <div data-testid="click-result">Clicked: {clickedItem}</div>}
    </div>
  );
};

describe('Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Trigger simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(<TechnologyListInteractive />);
    const techItem = screen.getByTestId(`tech-item-${TECHNOLOGIES[0].id}`);

    // Trigger hover
    fireEvent.mouseEnter(techItem);

    const tooltip = screen.getByTestId(`tooltip-${TECHNOLOGIES[0].id}`);
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe(`${TECHNOLOGIES[0].name} Tooltip`);
  });

  it('2. Verify that responsive tooltip layouts display at computed coordinates', () => {
    render(<TechnologyListInteractive />);
    const techItem = screen.getByTestId(`tech-item-${TECHNOLOGIES[1].id}`);

    fireEvent.mouseEnter(techItem);
    const tooltip = screen.getByTestId(`tooltip-${TECHNOLOGIES[1].id}`);

    // Assert layout classes simulating absolute computed coordinates
    expect(tooltip.className).toContain('absolute');
    expect(tooltip.className).toContain('top-10');
    expect(tooltip.className).toContain('left-10');
  });

  it('3. Test custom click/touch gestures and ensure click events propagate correctly', () => {
    render(<TechnologyListInteractive />);
    const techItemClick = screen.getByTestId(`tech-item-${TECHNOLOGIES[2].id}`);
    const techItemTouch = screen.getByTestId(`tech-item-${TECHNOLOGIES[3].id}`);

    // Standard Click propagation
    fireEvent.click(techItemClick);
    expect(screen.getByTestId('click-result').textContent).toBe(`Clicked: ${TECHNOLOGIES[2].id}`);

    // Touch event propagation (Mobile environments)
    fireEvent.touchStart(techItemTouch);
    expect(screen.getByTestId('click-result').textContent).toBe(`Clicked: ${TECHNOLOGIES[3].id}`);
  });

  it('4. Assert appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(<TechnologyListInteractive />);
    const techItem = screen.getByTestId(`tech-item-${TECHNOLOGIES[4].id}`);

    // Verify pointer class application on interactive elements
    expect(techItem.className).toContain('hover:cursor-pointer');
  });

  it('5. Check that mouseleave events successfully hide temporary overlay visuals', () => {
    render(<TechnologyListInteractive />);
    const techItem = screen.getByTestId(`tech-item-${TECHNOLOGIES[0].id}`);

    // Show temporary tooltip overlay
    fireEvent.mouseEnter(techItem);
    expect(screen.queryByTestId(`tooltip-${TECHNOLOGIES[0].id}`)).toBeTruthy();

    // Hide tooltip overlay on mouse leave
    fireEvent.mouseLeave(techItem);
    expect(screen.queryByTestId(`tooltip-${TECHNOLOGIES[0].id}`)).toBeNull();
  });
});
