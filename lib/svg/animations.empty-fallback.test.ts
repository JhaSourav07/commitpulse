import { describe, expect, it } from 'vitest';
import { getTowerAnimationCSS } from './animations';

describe('animations Edge Cases & Empty/Missing Inputs Verification', () => {
  it('Case 1: uses rise animation when entrance is undefined', () => {
    const css = getTowerAnimationCSS(undefined);

    expect(css).toContain('.cp-tower');
    expect(css).toContain('grow-up');
  });

  it('Case 2: handles none entrance without animation keyframes', () => {
    const css = getTowerAnimationCSS('none');

    expect(css).toContain('scaleY(1)');
    expect(css).not.toContain('@keyframes grow-up');
  });

  it('Case 3: handles missing scale value safely', () => {
    const css = getTowerAnimationCSS('rise');

    expect(css).toContain('transform-origin');
    expect(css).toContain('10px');
  });

  it('Case 4: supports zero scale without runtime errors', () => {
    expect(() => getTowerAnimationCSS('rise', 0)).not.toThrow();

    const css = getTowerAnimationCSS('rise', 0);

    expect(css).toContain('0px');
  });

  it('Case 5: always includes reduced motion fallback styles', () => {
    const css = getTowerAnimationCSS();

    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('animation: none');
  });
});
