import { describe, it, expect } from 'vitest';
import { getTowerAnimationCSS } from './animations';

describe('getTowerAnimationCSS', () => {
  it('returns rise animation by default', () => {
    const css = getTowerAnimationCSS();
    expect(css).toContain('.cp-tower');
    expect(css).toContain('@keyframes grow-up');
    expect(css).toContain('transform: scaleY(0)');
    expect(css).toContain('transform: scaleY(1)');
    expect(css).toContain('transform-origin: 0 10px');
  });

  it('returns fade animation when requested', () => {
    const css = getTowerAnimationCSS('fade');
    expect(css).toContain('@keyframes fade-in');
    expect(css).toContain('opacity: 0');
    expect(css).toContain('opacity: 1');
  });

  it('returns slide animation when requested', () => {
    const css = getTowerAnimationCSS('slide');
    expect(css).toContain('@keyframes slide-down');
    expect(css).toContain('transform: translateY(-20px)');
  });

  it('returns static render when entrance is none', () => {
    const css = getTowerAnimationCSS('none');
    expect(css).toContain('transform: scaleY(1)');
    expect(css).not.toContain('@keyframes');
  });

  it('scales transform-origin for rise animation when scale factor is provided', () => {
    const cssScale045 = getTowerAnimationCSS('rise', 0.45);
    expect(cssScale045).toContain('transform-origin: 0 4.5px');

    const cssScale08 = getTowerAnimationCSS('rise', 0.8);
    expect(cssScale08).toContain('transform-origin: 0 8px');
  });

  it('scales translateY translation for slide animation when scale factor is provided', () => {
    const cssScale045 = getTowerAnimationCSS('slide', 0.45);
    expect(cssScale045).toContain('transform: translateY(-9px)');

    const cssScale08 = getTowerAnimationCSS('slide', 0.8);
    expect(cssScale08).toContain('transform: translateY(-16px)');
  });

  it('includes accessibility support for prefers-reduced-motion', () => {
    const css = getTowerAnimationCSS('rise');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('animation: none !important');
  });
});
