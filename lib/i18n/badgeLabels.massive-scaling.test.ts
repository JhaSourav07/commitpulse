import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { getLabels, labels, supportedLanguages, type BadgeLabels } from './badgeLabels';
import '@testing-library/jest-dom/vitest';

// Component mapping contributor lists to labels
interface ContributorAction {
  username: string;
  commits: number;
  streak: number;
  lang: string;
}

interface MassiveScalingWrapperProps {
  contributors: ContributorAction[];
}

const BadgeLabelsMassiveScalingWrapper = ({ contributors }: MassiveScalingWrapperProps) => {
  return React.createElement(
    'div',
    {
      className: 'contributor-grid',
      style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
      'data-testid': 'contributor-grid-container',
    },
    contributors.map((contrib, index) => {
      const activeLabels = getLabels(contrib.lang);
      return React.createElement(
        'div',
        {
          key: index,
          className: 'contributor-card',
          'data-testid': 'contributor-card',
          style: { padding: '8px', border: '1px solid #ccc' },
        },
        React.createElement(
          'span',
          { className: 'username', 'data-testid': `username-${index}` },
          contrib.username
        ),
        React.createElement(
          'span',
          { className: 'label-streak', 'data-testid': `streak-lbl-${index}` },
          activeLabels.CURRENT_STREAK
        ),
        React.createElement(
          'span',
          { className: 'val-streak', 'data-testid': `streak-val-${index}` },
          contrib.streak
        ),
        React.createElement(
          'span',
          { className: 'label-commits', 'data-testid': `commits-lbl-${index}` },
          activeLabels.COMMITS_THIS_MONTH
        ),
        React.createElement(
          'span',
          { className: 'val-commits', 'data-testid': `commits-val-${index}` },
          contrib.commits
        )
      );
    })
  );
};

// Component for testing SVG coordinate scaling and layouts
interface SVGItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface SVGScaleWrapperProps {
  items: SVGItem[];
  sf: number;
}

const SVGScaleWrapper = ({ items, sf }: SVGScaleWrapperProps) => {
  const scale = (val: number) => Math.round(val * sf * 10) / 10;

  return React.createElement(
    'svg',
    {
      width: scale(600),
      height: scale(400),
      viewBox: `0 0 ${scale(600)} ${scale(400)}`,
      'data-testid': 'svg-container',
    },
    items.map((item) =>
      React.createElement(
        'g',
        { key: item.id, 'data-testid': `group-${item.id}` },
        React.createElement('rect', {
          x: scale(item.x),
          y: scale(item.y),
          width: scale(item.width),
          height: scale(item.height),
          'data-testid': `rect-${item.id}`,
        }),
        React.createElement(
          'text',
          {
            x: scale(item.x + item.width / 2),
            y: scale(item.y + item.height / 2),
            'data-testid': `text-${item.id}`,
            className: 'text-wrap-safe',
            style: { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' },
          },
          item.label
        )
      )
    )
  );
};

describe('badgeLabels Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('Case 1: resolves 5,000 locale lookups rapidly without structural breakage', () => {
    const locales = [...supportedLanguages, 'xx', 'zz', '', 'UNKNOWN'];
    const REQUIRED_KEYS: (keyof BadgeLabels)[] = [
      'CURRENT_STREAK',
      'ANNUAL_SYNC_TOTAL',
      'PEAK_STREAK',
      'COMMITS_THIS_MONTH',
      'VS_LAST_MONTH',
    ];

    // Warm up the JS engine compiler
    for (let i = 0; i < 100; i++) {
      getLabels(locales[i % locales.length]);
    }

    const start = performance.now();
    for (let i = 0; i < 5_000; i++) {
      const lang = locales[i % locales.length];
      const result = getLabels(lang);

      // Perform fast assertion checks inline without calling expect() inside the hot loop
      // to avoid Vitest assertion framework call stack overhead.
      if (
        !result ||
        typeof result.CURRENT_STREAK !== 'string' ||
        result.CURRENT_STREAK.length === 0
      ) {
        throw new Error(`Structural validation failed for lang ${lang}`);
      }
    }
    const duration = performance.now() - start;

    // Verify key properties of a final sample using expect
    const sample = getLabels('en');
    for (const key of REQUIRED_KEYS) {
      expect(sample).toHaveProperty(key);
      expect(typeof sample[key]).toBe('string');
      expect(sample[key].length).toBeGreaterThan(0);
    }

    // Set a very generous threshold (2,000ms) to ensure tests don't flake on slow CI
    // environment runners, while still guarding against extreme algorithmic regressions.
    expect(duration).toBeLessThan(2000);
  });

  it('Case 2: handles extreme/malformed lang inputs without throwing and falls back properly', () => {
    const edgeCases = [
      'a'.repeat(10_000),
      '9'.repeat(5_000),
      '\u{1F600}'.repeat(1_000), // emoji repeat
      String(Number.MAX_SAFE_INTEGER),
      '\x00\x01\x02',
      '   en   ',
      'ZH-CN',
      '--',
    ];
    for (const input of edgeCases) {
      expect(() => getLabels(input)).not.toThrow();
      const result = getLabels(input);
      expect(result).toBeDefined();
      expect(typeof result.CURRENT_STREAK).toBe('string');
    }
  });

  it('Case 3: renders a listing of 500 contributor records with max-value metrics without crashing the DOM tree', () => {
    const records: ContributorAction[] = Array.from({ length: 500 }, (_, i) => ({
      username: `Contributor_${i}`,
      commits: Number.MAX_SAFE_INTEGER,
      streak: 999_999,
      lang: supportedLanguages[i % supportedLanguages.length],
    }));

    const start = performance.now();
    render(React.createElement(BadgeLabelsMassiveScalingWrapper, { contributors: records }));
    const duration = performance.now() - start;

    const container = screen.getByTestId('contributor-grid-container');
    expect(container).toBeInTheDocument();

    const cards = screen.getAllByTestId('contributor-card');
    expect(cards).toHaveLength(500);

    // Spotlight check bounds on the first card
    const firstStreakVal = screen.getByTestId('streak-val-0');
    expect(firstStreakVal).toHaveTextContent('999999');

    const firstCommitsVal = screen.getByTestId('commits-val-0');
    expect(firstCommitsVal).toHaveTextContent(String(Number.MAX_SAFE_INTEGER));

    // Uses a highly generous threshold of 10 seconds to avoid flakiness in JSDOM's
    // virtual DOM renderer on resource-constrained CI machines.
    expect(duration).toBeLessThan(10000);
  });

  it('Case 4: asserts simulated SVG coordinates scale cleanly, do not overlap mathematically, and text-wrapping styles are attached', () => {
    // Generate 50 items positioned side-by-side
    const items: SVGItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      x: i * 100, // 100px wide slots
      y: 50,
      width: 80,
      height: 30,
      label: `Label for item ${i} in multiple languages - ${getLabels(supportedLanguages[i % supportedLanguages.length]).CURRENT_STREAK}`,
    }));

    const scaleFactors = [0.1, 0.5, 1.0, 2.5, 5.0];

    for (const sf of scaleFactors) {
      const { unmount } = render(React.createElement(SVGScaleWrapper, { items, sf }));
      const svg = screen.getByTestId('svg-container');
      expect(svg).toBeInTheDocument();

      // Check specific coordinates and text formatting attributes in DOM
      items.forEach((item, idx) => {
        const rect = screen.getByTestId(`rect-${item.id}`);
        const text = screen.getByTestId(`text-${item.id}`);

        const scaledX = Math.round(item.x * sf * 10) / 10;
        const scaledY = Math.round(item.y * sf * 10) / 10;
        const scaledW = Math.round(item.width * sf * 10) / 10;
        const scaledH = Math.round(item.height * sf * 10) / 10;

        expect(rect).toHaveAttribute('x', String(scaledX));
        expect(rect).toHaveAttribute('y', String(scaledY));
        expect(rect).toHaveAttribute('width', String(scaledW));
        expect(rect).toHaveAttribute('height', String(scaledH));

        // Ensure math returned finite numbers
        expect(Number.isFinite(scaledX)).toBe(true);
        expect(Number.isFinite(scaledY)).toBe(true);
        expect(Number.isFinite(scaledW)).toBe(true);
        expect(Number.isFinite(scaledH)).toBe(true);

        // Verify text wrapping styles are applied correctly on elements
        expect(text).toHaveStyle({
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        });

        // Layout overlap protection assertion:
        // Ensure rect bounds do not intersect mathematically if they are distinct elements
        if (idx > 0) {
          const prevItem = items[idx - 1];
          const prevScaledX = Math.round(prevItem.x * sf * 10) / 10;
          const prevScaledW = Math.round(prevItem.width * sf * 10) / 10;
          // Items are side by side, so current X must be greater than previous X + previous width
          expect(scaledX).toBeGreaterThanOrEqual(prevScaledX + prevScaledW);
        }
      });

      unmount();
    }
  });

  it('Case 5: 20,000 rapid successive getLabels calls complete rapidly and different locales in registry are independent references', () => {
    const langs = Object.keys(labels);

    // Warm up the JS engine compiler
    for (let i = 0; i < 100; i++) {
      getLabels(langs[i % langs.length]);
    }

    const start = performance.now();
    for (let i = 0; i < 20_000; i++) {
      const result = getLabels(langs[i % langs.length]);
      // Spot check to prevent compiler optimization discarding loop
      if (!result || !result.CURRENT_STREAK) {
        throw new Error('Missing CURRENT_STREAK');
      }
    }
    const duration = performance.now() - start;

    // Generous threshold to protect against CPU spikes on CI environments
    expect(duration).toBeLessThan(3000);

    // Assert registry reference isolation: locale objects should not share mutable properties
    for (let i = 0; i < langs.length; i++) {
      for (let j = i + 1; j < langs.length; j++) {
        expect(labels[langs[i]]).not.toBe(labels[langs[j]]);
      }
    }
  });
});
