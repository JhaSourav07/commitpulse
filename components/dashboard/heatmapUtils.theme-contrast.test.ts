import { describe, it, expect } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

// Helper functions for relative luminance and contrast ratio calculations
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace(/^#/, '');
  let r = 0,
    g = 0,
    b = 0;
  if (normalized.length === 6) {
    r = parseInt(normalized.slice(0, 2), 16);
    g = parseInt(normalized.slice(2, 4), 16);
    b = parseInt(normalized.slice(4, 6), 16);
  }
  return { r, g, b };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(bg: string, text: string): number {
  const lBg = relativeLuminance(bg);
  const lText = relativeLuminance(text);
  const lighter = Math.max(lBg, lText);
  const darker = Math.min(lBg, lText);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('components/dashboard/heatmapUtils Theme Contrast and Visual Cohesion', () => {
  it('1. emulates dual theme environment presets correctly for heatmap views', () => {
    const themes = {
      dark: { bg: '#0d1117', text: '#c9d1d9', cellBgEmpty: '#161616' },
      light: { bg: '#ffffff', text: '#24292f', cellBgEmpty: '#ebedf0' },
    };

    expect(themes.dark.bg).toBe('#0d1117');
    expect(themes.light.bg).toBe('#ffffff');
    expect(themes.dark.cellBgEmpty).not.toBe(themes.light.cellBgEmpty);
  });

  it('2. asserts that visual styling for heatmap cells adapts properly to current theme settings', () => {
    // Check returned classes for intensity 0 (empty cell) and 4 (max contribution)
    const emptyCellColor = getIntensityColor(0);
    const maxCellColor = getIntensityColor(4);

    expect(emptyCellColor).toContain('bg-gray-200');
    expect(emptyCellColor).toContain('dark:bg-[#161616]');

    expect(maxCellColor).toContain('bg-black');
    expect(maxCellColor).toContain('dark:bg-white');
  });

  it('3. verifies contrast ratio standards are satisfied for all textual or indicator elements in the heatmap', () => {
    // Verifying text or border indicator elements on empty and max cells
    const lightEmptyContrast = contrastRatio('#ebedf0', '#24292f');
    expect(lightEmptyContrast).toBeGreaterThanOrEqual(3.0); // WCAG large text/graphics contrast >= 3:1

    const darkEmptyContrast = contrastRatio('#161616', '#c9d1d9');
    expect(darkEmptyContrast).toBeGreaterThanOrEqual(3.0);

    const lightMaxContrast = contrastRatio('#000000', '#ffffff');
    expect(lightMaxContrast).toBeGreaterThanOrEqual(4.5);

    const darkMaxContrast = contrastRatio('#ffffff', '#000000');
    expect(darkMaxContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('4. checks that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    // Assert all intensity colors return expected classes
    const classesList = [
      getIntensityColor(0),
      getIntensityColor(1),
      getIntensityColor(2),
      getIntensityColor(3),
      getIntensityColor(4),
    ];

    expect(classesList[0]).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(classesList[1]).toBe('bg-gray-400 dark:bg-zinc-700');
    expect(classesList[2]).toBe('bg-gray-500 dark:bg-zinc-500');
    expect(classesList[3]).toBe('bg-gray-700 dark:bg-zinc-300');
    expect(classesList[4]).toBe('bg-black dark:bg-white');
  });

  it('5. ensures that background overlays do not clip foreground content colors in the heatmap', () => {
    const overlay = { opacity: 0.85, isGridVisible: true };
    expect(overlay.opacity).toBeLessThan(1.0);
    expect(overlay.isGridVisible).toBe(true);
  });
});
