import { describe, it, expect } from 'vitest';
import { AUTO_THEME_DARK, AUTO_THEME_LIGHT } from './themes';
import { contrastRatio, relativeLuminance } from './themes/test-utils';

describe('Dark and Light prefers-color-scheme visual cohesion', () => {
  it('provides distinct AUTO_THEME_DARK and AUTO_THEME_LIGHT presets', () => {
    expect(AUTO_THEME_DARK).toBeDefined();
    expect(AUTO_THEME_LIGHT).toBeDefined();
    expect(AUTO_THEME_DARK.bg).not.toBe(AUTO_THEME_LIGHT.bg);
  });

  it('adapts background luminance appropriately for each color scheme', () => {
    const darkLum = relativeLuminance(AUTO_THEME_DARK.bg);
    const lightLum = relativeLuminance(AUTO_THEME_LIGHT.bg);
    expect(darkLum).toBeLessThan(0.1);
    expect(lightLum).toBeGreaterThan(0.9);
  });

  it('satisfies WCAG AA contrast ratio for text in both dark and light modes', () => {
    const darkRatio = contrastRatio(AUTO_THEME_DARK.bg, AUTO_THEME_DARK.text);
    const lightRatio = contrastRatio(AUTO_THEME_LIGHT.bg, AUTO_THEME_LIGHT.text);
    expect(darkRatio).toBeGreaterThanOrEqual(4.5);
    expect(lightRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('includes all required theme properties for both auto presets', () => {
    expect(AUTO_THEME_DARK).toHaveProperty('bg');
    expect(AUTO_THEME_DARK).toHaveProperty('text');
    expect(AUTO_THEME_DARK).toHaveProperty('accent');
    expect(AUTO_THEME_LIGHT).toHaveProperty('bg');
    expect(AUTO_THEME_LIGHT).toHaveProperty('text');
    expect(AUTO_THEME_LIGHT).toHaveProperty('accent');
  });

  it('ensures background does not collide with foreground accent colors in either mode', () => {
    expect(AUTO_THEME_DARK.bg).not.toBe(AUTO_THEME_DARK.text);
    expect(AUTO_THEME_DARK.bg).not.toBe(AUTO_THEME_DARK.accent);
    expect(AUTO_THEME_LIGHT.bg).not.toBe(AUTO_THEME_LIGHT.text);
    expect(AUTO_THEME_LIGHT.bg).not.toBe(AUTO_THEME_LIGHT.accent);
  });
});
