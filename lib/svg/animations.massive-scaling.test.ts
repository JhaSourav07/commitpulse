import { describe, expect, it } from 'vitest';
import { getTowerAnimationCSS } from './animations';

describe('animations - Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('handles extremely large scale values for rise animations', () => {
    const css = getTowerAnimationCSS('rise', 1000);

    expect(css).toContain('transform-origin: 0 10000px');
    expect(css).toContain('@keyframes grow-up');
  });

  it('handles extremely large scale values for slide animations', () => {
    const css = getTowerAnimationCSS('slide', 1000);

    expect(css).toContain('translateY(-20000px)');
    expect(css).toContain('@keyframes slide-down');
  });

  it('generates valid CSS for thousands of rise animation requests', () => {
    const results = Array.from({ length: 5000 }, (_, i) =>
      getTowerAnimationCSS('rise', i / 100 + 1)
    );

    expect(results).toHaveLength(5000);
    expect(results[0]).toContain('.cp-tower');
    expect(results[4999]).toContain('@keyframes grow-up');
  });

  it('generates valid CSS for thousands of slide animation requests', () => {
    const results = Array.from({ length: 5000 }, (_, i) =>
      getTowerAnimationCSS('slide', i / 100 + 1)
    );

    expect(results).toHaveLength(5000);
    expect(results[0]).toContain('.cp-tower');
    expect(results[4999]).toContain('@keyframes slide-down');
  });

  it('preserves reduced-motion accessibility CSS under extreme scale values', () => {
    const css = getTowerAnimationCSS('rise', Number.MAX_SAFE_INTEGER);

    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('animation: none !important');
    expect(css).toContain('.cp-tower');
  });
});
