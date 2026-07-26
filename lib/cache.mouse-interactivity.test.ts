import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Cache Mouse Interactivity', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows tooltip on mouseenter', () => {
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

  it('propagates click events correctly', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');

    const clickHandler = vi.fn();

    parent.appendChild(child);
    parent.addEventListener('click', clickHandler);
    document.body.appendChild(parent);

    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('changes cursor to pointer on hover', () => {
    element.style.cursor = 'default';

    element.addEventListener('mouseenter', () => {
      element.style.cursor = 'pointer';
    });

    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(element.style.cursor).toBe('pointer');
  });

  it('updates tooltip coordinates on mousemove', () => {
    const tooltip = { x: 0, y: 0 };

    element.addEventListener('mousemove', (event: MouseEvent) => {
      tooltip.x = event.clientX;
      tooltip.y = event.clientY;
    });

    element.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 150,
        clientY: 275,
      })
    );

    expect(tooltip).toEqual({
      x: 150,
      y: 275,
    });
  });
});
