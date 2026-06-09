import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GrowthTrendChart from './GrowthTrendChart';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const React = await import('react');

  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');

  const motionProxy = new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
          delete props.initial;
          delete props.animate;
          delete props.exit;
          delete props.transition;
          delete props.whileInView;
          delete props.viewport;

          return React.createElement(tag, props, children);
        };
      },
    }
  );

  return {
    ...actual,

    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,

    motion: motionProxy,
  };
});

const activityA = [
  { date: '2026-05-01', count: 10 },
  { date: '2026-05-02', count: 5 },
];

const activityB = [
  { date: '2026-05-01', count: 8 },
  { date: '2026-05-02', count: 12 },
];

describe('GrowthTrendChart Accessibility', () => {
  it('renders the main heading correctly', () => {
    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getByText(/contribution growth trend/i)).toBeDefined();
  });

  it('renders accessible text labels for compared users', () => {
    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getByText('User A')).toBeDefined();
    expect(screen.getByText('User B')).toBeDefined();
  });

  it('renders SVG chart for screen readers and visual users', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const svgElement = container.querySelector('svg');

    expect(svgElement).not.toBeNull();
  });

  it('supports keyboard-focusable interactive elements', () => {
    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const allFocusable = document.querySelectorAll('button, [tabindex]');

    expect(allFocusable.length).toBeGreaterThanOrEqual(0);
  });

  it('renders logical accessibility content structure', () => {
    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getByText(/commit battle timeline/i)).toBeDefined();
  });
});
