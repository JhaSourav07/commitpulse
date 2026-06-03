import { describe, it, expect } from 'vitest';
import { createAnimation } from './theme-switch';

describe('ThemeSwitch', () => {
  it('creates a circle animation', () => {
    const animation = createAnimation('circle', 'center');

    expect(animation).toBeDefined();
    expect(animation.name).toContain('circle');
    expect(typeof animation.css).toBe('string');
  });

  it('creates a rectangle animation', () => {
    const animation = createAnimation('rectangle', 'top-left');

    expect(animation.name).toContain('rectangle');
    expect(typeof animation.css).toBe('string');
  });

  it('creates a polygon animation', () => {
    const animation = createAnimation('polygon', 'top-right');

    expect(animation.name).toContain('polygon');
    expect(typeof animation.css).toBe('string');
  });

  it('creates a gif animation', () => {
    const animation = createAnimation('gif', 'center', false, 'test.gif');

    expect(animation.name).toContain('gif');
    expect(typeof animation.css).toBe('string');
  });

  it('returns name and css properties', () => {
    const animation = createAnimation('circle');

    expect(animation).toHaveProperty('name');
    expect(animation).toHaveProperty('css');
  });
});
