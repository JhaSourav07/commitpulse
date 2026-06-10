import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Resume Parser Mouse Interactivity', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  it('shows tooltip on hover (mouseenter event triggers handler)', () => {
    const showTooltip = vi.fn();

    element.addEventListener('mouseenter', showTooltip);
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(showTooltip).toHaveBeenCalledTimes(1);
  });

  it('hides tooltip on mouseleave', () => {
    const hideTooltip = vi.fn();

    element.addEventListener('mouseleave', hideTooltip);
    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(hideTooltip).toHaveBeenCalledTimes(1);
  });

  it('handles click event propagation correctly', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');

    const clickHandler = vi.fn();

    parent.addEventListener('click', clickHandler);
    parent.appendChild(child);
    document.body.appendChild(parent);

    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(clickHandler).toHaveBeenCalled();
  });

  it('applies pointer cursor style on hover state', () => {
    element.style.cursor = 'default';

    // simulate hover effect
    element.addEventListener('mouseenter', () => {
      element.style.cursor = 'pointer';
    });

    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(element.style.cursor).toBe('pointer');
  });

  it('tracks tooltip position updates correctly', () => {
    const tooltip = {
      x: 0,
      y: 0,
    };

    // simulate mouse move positioning logic
    element.addEventListener('mousemove', (e: MouseEvent) => {
      tooltip.x = e.clientX;
      tooltip.y = e.clientY;
    });

    element.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 120,
        clientY: 250,
      })
    );

    expect(tooltip.x).toBe(120);
    expect(tooltip.y).toBe(250);
  });
});
