import { describe, it, expect } from 'vitest';
import { TOWER_ANIMATION_CSS } from './animations';

describe('TOWER_ANIMATION_CSS', () => {
  it('contains required CSS classes and keyframes', () => {
    expect(TOWER_ANIMATION_CSS).toContain('.cp-tower');
    expect(TOWER_ANIMATION_CSS).toContain('@keyframes grow-up');
  });

  it('defines correct transform states for the grow-up animation', () => {
    expect(TOWER_ANIMATION_CSS).toContain('transform: scaleY(0)');
    expect(TOWER_ANIMATION_CSS).toContain('transform: scaleY(1)');
  });

  it('sets the correct transform-origin for towers to grow from the ground', () => {
    expect(TOWER_ANIMATION_CSS).toContain('transform-origin: 0 10px');
  });

  it('includes accessibility support for prefers-reduced-motion', () => {
    expect(TOWER_ANIMATION_CSS).toContain('prefers-reduced-motion');
    // Ensure that the animation is disabled for reduced motion
    expect(TOWER_ANIMATION_CSS).toContain('animation: none !important');
  });
});
