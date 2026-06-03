import { renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { createAnimation, useThemeToggle } from './theme-switch';

describe('ThemeSwitch massive scaling behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('creates a large number of circle animations without failure', () => {
    const animations = Array.from({ length: 1000 }, (_, index) =>
      createAnimation('circle', index % 2 === 0 ? 'top-right' : 'bottom-left')
    );

    expect(animations).toHaveLength(1000);
    expect(animations.every((item) => item.css.length > 0)).toBe(true);
  });

  it('creates large batches of polygon animations successfully', () => {
    const animations = Array.from({ length: 500 }, () => createAnimation('polygon', 'top-right'));

    expect(animations).toHaveLength(500);
    expect(animations.every((item) => item.name.includes('polygon'))).toBe(true);
  });

  it('handles repeated hook initialization under heavy load', () => {
    expect(() => {
      for (let i = 0; i < 100; i++) {
        renderHook(() => useThemeToggle());
      }
    }).not.toThrow();
  });

  it('generates animation css consistently at high volume', () => {
    const cssOutput = Array.from(
      { length: 200 },
      () => createAnimation('rectangle', 'left-right').css
    );

    expect(cssOutput.every((css) => css.includes('clip-path'))).toBe(true);
  });

  it('supports large numbers of animation variants without empty output', () => {
    const variants = ['circle', 'rectangle', 'polygon', 'circle-blur'] as const;

    const results = [];

    for (let i = 0; i < 250; i++) {
      results.push(createAnimation(variants[i % variants.length], 'center'));
    }

    expect(results).toHaveLength(250);
    expect(results.every((item) => item.css.length > 0)).toBe(true);
  });
});
