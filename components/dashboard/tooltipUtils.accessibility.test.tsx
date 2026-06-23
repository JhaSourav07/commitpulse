// components/dashboard/tooltipUtils.accessibility.test.ts
//
// Accessibility Standards & Screen Reader Aria Compliance
// Tests target the VisualizationTooltip React component which renders
// DOM nodes with role="tooltip" — verifying WCAG 2.1 / ARIA compliance.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Framer Motion mock — jsdom cannot run CSS animations
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => {
  const MockMotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      whileHover?: unknown;
      whileTap?: unknown;
      variants?: unknown;
      children?: React.ReactNode;
    }
  >(function MockMotionDiv(
    { children, initial, animate, exit, transition, whileHover, whileTap, variants, ...domProps },
    ref
  ) {
    void initial;
    void animate;
    void exit;
    void transition;
    void whileHover;
    void whileTap;
    void variants;
    return (
      <div {...domProps} ref={ref}>
        {children}
      </div>
    );
  });

  return {
    motion: { div: MockMotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import VisualizationTooltip from './VisualizationTooltip';

// ---------------------------------------------------------------------------
// Test 1 — role="tooltip" attribute
// WCAG 4.1.2 (Name, Role, Value)
// ---------------------------------------------------------------------------
describe('VisualizationTooltip – role attribute compliance', () => {
  it('renders with role="tooltip" so assistive technologies correctly identify the element', () => {
    render(
      <VisualizationTooltip title="Test Title" x={100} y={200}>
        <span>Content</span>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 2 — title is announced by screen readers
// WCAG 1.3.1 (Info and Relationships)
// ---------------------------------------------------------------------------
describe('VisualizationTooltip – accessible title announcement', () => {
  it('renders the title prop as visible text that screen readers can announce', () => {
    render(
      <VisualizationTooltip title="Commits: 42" x={100} y={200}>
        <span>Detail content</span>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('Commits: 42');
  });
});

// ---------------------------------------------------------------------------
// Test 3 — children content is rendered inside tooltip
// WCAG 1.3.3 (Sensory Characteristics)
// ---------------------------------------------------------------------------
describe('VisualizationTooltip – descriptive children content', () => {
  it('renders children inside the tooltip so screen readers announce the full description', () => {
    render(
      <VisualizationTooltip title="Activity" x={50} y={80}>
        <span>Monday: 5 commits</span>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('Monday: 5 commits');
  });
});

// ---------------------------------------------------------------------------
// Test 4 — tooltip content must not be empty
// WCAG 4.1.2 (Name, Role, Value)
// ---------------------------------------------------------------------------
describe('VisualizationTooltip – non-empty accessible label', () => {
  it('produces non-empty text content so aria-label is always populated for screen readers', () => {
    render(
      <VisualizationTooltip title="Peak Day" x={0} y={0}>
        <span>12 contributions</span>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent?.trim().length).toBeGreaterThan(0);
    expect(tooltip.textContent).not.toMatch(/^\s*undefined\s*$/i);
    expect(tooltip.textContent).not.toMatch(/^\s*null\s*$/i);
  });
});

// ---------------------------------------------------------------------------
// Test 5 — position-independent accessible content
// WCAG 1.3.3 (Sensory Characteristics)
// ---------------------------------------------------------------------------
describe('VisualizationTooltip – position-independent accessible content', () => {
  it('contains meaningful text regardless of x/y coordinates so screen readers are not affected by visual position', () => {
    const positions = [
      { x: 0, y: 0 },
      { x: 500, y: 300 },
      { x: 9999, y: 9999 },
    ];

    for (const pos of positions) {
      const { unmount } = render(
        <VisualizationTooltip title="Language: TypeScript" x={pos.x} y={pos.y}>
          <span>68% of codebase</span>
        </VisualizationTooltip>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.textContent).toContain('Language: TypeScript');
      expect(tooltip.textContent).toContain('68% of codebase');
      unmount();
    }
  });
});
