import { describe, expect, test } from 'vitest';
import { getTowerAnimationCSS } from './animations';

describe('animations theme contrast', () => {
  test('keeps tower visible when animation is disabled', () => {
    const css = getTowerAnimationCSS('none');

    expect(css).toContain('opacity: 1');
    expect(css).toContain('scaleY(1)');
  });

  test('keeps foreground elements visible in rise animation', () => {
    const css = getTowerAnimationCSS('rise');

    expect(css).toContain('transform-origin');
    expect(css).toContain('animation: grow-up');
    expect(css).not.toContain('display: none');
  });

  test('supports fade animation without hiding final content', () => {
    const css = getTowerAnimationCSS('fade');

    expect(css).toContain('fade-in');
    expect(css).toContain('opacity: 1');
  });

  test('supports slide animation without clipping content', () => {
    const css = getTowerAnimationCSS('slide');

    expect(css).toContain('translateY');
    expect(css).not.toContain('overflow: hidden');
  });

  test('respects reduced motion accessibility preference', () => {
    const css = getTowerAnimationCSS('rise');

    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none !important');
    expect(css).toContain('opacity: 1 !important');
  });
});
