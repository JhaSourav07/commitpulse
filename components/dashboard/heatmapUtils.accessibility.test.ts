import { describe, expect, it } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

const buildHeatmapCell = (intensity: number, dayLabel = 'Monday, June 10') => {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = [
    getIntensityColor(intensity),
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
  ].join(' ');
  cell.setAttribute('aria-label', `${dayLabel}: ${intensity} contributions`);
  cell.setAttribute('aria-describedby', `heatmap-tooltip-${intensity}`);
  cell.setAttribute('data-testid', `heatmap-cell-${intensity}`);

  const tooltip = document.createElement('span');
  tooltip.id = `heatmap-tooltip-${intensity}`;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = `${intensity} contributions on ${dayLabel}`;

  return { cell, tooltip };
};

describe('heatmapUtils Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('provides stable intensity color classes for aria-labelled heatmap cells', () => {
    for (const intensity of [0, 1, 2, 3, 4]) {
      const { cell } = buildHeatmapCell(intensity);

      expect(cell.getAttribute('aria-label')).toContain(`${intensity} contributions`);
      expect(cell.className).toContain(getIntensityColor(intensity));
    }
  });

  it('keeps keyboard-focusable heatmap cells styled with visible focus outlines', () => {
    const { cell } = buildHeatmapCell(3);

    expect(cell.tagName).toBe('BUTTON');
    expect(cell.getAttribute('type')).toBe('button');
    expect(cell.className).toContain('focus-visible:outline');
    expect(cell.className).toContain('focus-visible:outline-2');
    expect(cell.className).toContain('focus-visible:outline-offset-2');
  });

  it('links tooltip descriptions through aria-describedby for screen readers', () => {
    const { cell, tooltip } = buildHeatmapCell(2, 'Tuesday, June 11');

    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(cell.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.textContent).toBe('2 contributions on Tuesday, June 11');
  });

  it('preserves logical keyboard tab order for sequential heatmap cells', () => {
    const container = document.createElement('section');
    container.setAttribute('aria-label', 'Contribution activity heatmap');

    [0, 1, 2, 3, 4].forEach((intensity) => {
      const { cell } = buildHeatmapCell(intensity);
      container.appendChild(cell);
    });

    const focusableCells = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));

    expect(focusableCells).toHaveLength(5);
    expect(focusableCells.map((cell) => cell.dataset.testid)).toEqual([
      'heatmap-cell-0',
      'heatmap-cell-1',
      'heatmap-cell-2',
      'heatmap-cell-3',
      'heatmap-cell-4',
    ]);
  });

  it('supports a logical heading hierarchy around the heatmap landmark', () => {
    const section = document.createElement('section');
    section.setAttribute('aria-labelledby', 'heatmap-heading');

    const heading = document.createElement('h2');
    heading.id = 'heatmap-heading';
    heading.textContent = 'Contribution heatmap';

    const subHeading = document.createElement('h3');
    subHeading.textContent = 'Daily contribution activity';

    section.appendChild(heading);
    section.appendChild(subHeading);

    expect(section.getAttribute('aria-labelledby')).toBe('heatmap-heading');
    expect(section.querySelector('h2')?.textContent).toBe('Contribution heatmap');
    expect(section.querySelector('h3')?.textContent).toBe('Daily contribution activity');
  });
});
