// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import type { GraphEdge, GraphNode, RecommendedTechnology } from './types';

/**
 * lib/graph/types.ts is a pure TypeScript type-definition module and exposes
 * no runtime DOM, JSX, or accessibility markup of its own.
 *
 * These tests validate that the graph data contracts provide the identifiers
 * and descriptive fields required by an accessible UI layer, then verify a
 * representative consumer implementation can apply ARIA semantics correctly.
 */

afterEach(() => {
  document.body.innerHTML = '';
});

const sampleEdge: GraphEdge = {
  targetId: 'react',
  score: 0.92,
  strength: 'strong',
  category: 'Frontend',
  reasons: ['Widely paired with Next.js', 'Strong community support'],
};

const sampleNode: GraphNode = {
  id: 'nextjs',
  edges: [sampleEdge],
};

const sampleRecommendations: RecommendedTechnology[] = [
  {
    id: 'react',
    score: 92,
    strength: 'strong',
    category: 'Frontend',
    reasons: ['Widely paired with Next.js', 'Strong community support'],
  },
  {
    id: 'postgresql',
    score: 71,
    strength: 'moderate',
    category: 'Database',
    reasons: ['Common choice for relational data'],
  },
];

function renderRecommendationsPanel(recommendations: RecommendedTechnology[]) {
  const root = document.createElement('section');
  root.setAttribute('aria-labelledby', 'recommendations-heading');

  const heading = document.createElement('h2');
  heading.id = 'recommendations-heading';
  heading.textContent = 'Recommended Technologies';
  root.appendChild(heading);

  const list = document.createElement('ul');
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Recommended technologies list');

  recommendations.forEach((rec) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'listitem');

    const button = document.createElement('button');
    button.type = 'button';
    button.tabIndex = 0;
    button.id = `rec-${rec.id}`;
    button.textContent = `${rec.id} (${rec.score}%)`;

    button.className =
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

    const descriptionId = `rec-${rec.id}-desc`;
    button.setAttribute('aria-describedby', descriptionId);

    const tooltip = document.createElement('span');
    tooltip.id = descriptionId;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = rec.reasons.join('. ');
    tooltip.className = 'sr-only';

    item.append(button, tooltip);
    list.appendChild(item);
  });

  root.appendChild(list);
  document.body.appendChild(root);

  return root;
}

describe('lib/graph/types — Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('exposes stable ids on GraphNode and GraphEdge suitable for accessibility references', () => {
    expect(typeof sampleNode.id).toBe('string');
    expect(sampleNode.id.length).toBeGreaterThan(0);

    expect(typeof sampleEdge.targetId).toBe('string');
    expect(sampleEdge.targetId.length).toBeGreaterThan(0);

    expect(sampleNode.id).not.toMatch(/\s/);
    expect(sampleEdge.targetId).not.toMatch(/\s/);
  });

  it('renders a recommendations panel with proper aria-labelledby, roles, and heading hierarchy', () => {
    const root = renderRecommendationsPanel(sampleRecommendations);

    expect(root.tagName).toBe('SECTION');
    expect(root.getAttribute('aria-labelledby')).toBe('recommendations-heading');

    const heading = root.querySelector('h2');

    expect(heading).not.toBeNull();
    expect(heading?.id).toBe('recommendations-heading');
    expect(heading?.textContent).toBe('Recommended Technologies');

    const list = root.querySelector('[role="list"]');

    expect(list).not.toBeNull();
    expect(list?.getAttribute('aria-label')).toBe('Recommended technologies list');

    const items = root.querySelectorAll('[role="listitem"]');

    expect(items.length).toBe(sampleRecommendations.length);
  });

  it('announces tooltip descriptions through aria-describedby using recommendation reasons', () => {
    const root = renderRecommendationsPanel(sampleRecommendations);

    sampleRecommendations.forEach((rec) => {
      const button = root.querySelector<HTMLButtonElement>(`#rec-${rec.id}`);

      expect(button).not.toBeNull();

      const describedBy = button!.getAttribute('aria-describedby');

      expect(describedBy).toBe(`rec-${rec.id}-desc`);

      const tooltip = root.querySelector(`#${describedBy}`);

      expect(tooltip).not.toBeNull();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
      expect(tooltip?.textContent).toBe(rec.reasons.join('. '));
      expect(tooltip!.textContent!.length).toBeGreaterThan(0);
    });
  });

  it('maintains focusable interactive nodes with visible outline classes and natural tab order', () => {
    const root = renderRecommendationsPanel(sampleRecommendations);

    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));

    expect(buttons.length).toBe(sampleRecommendations.length);

    buttons.forEach((button, index) => {
      expect(button.tabIndex).toBe(0);

      expect(button.className).toContain('focus-visible:outline');
      expect(button.className).toContain('focus-visible:outline-offset-2');

      expect(button.id).toBe(`rec-${sampleRecommendations[index].id}`);
    });

    // Verify keyboard focus follows DOM order
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);

    buttons[1].focus();
    expect(document.activeElement).toBe(buttons[1]);

    expect(buttons.map((button) => button.id)).toEqual(['rec-react', 'rec-postgresql']);
  });

  it('maintains a logical heading hierarchy for screen reader navigation', () => {
    const root = renderRecommendationsPanel(sampleRecommendations);

    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');

    expect(headings).toHaveLength(1);

    const heading = headings[0];

    expect(heading.tagName).toBe('H2');
    expect(heading.id).toBe('recommendations-heading');
    expect(heading.textContent).toBe('Recommended Technologies');

    expect(root.getAttribute('aria-labelledby')).toBe(heading.id);
  });
});
