import { describe, it, expect } from 'vitest';
import { computeFaceOpacity, computeTowers } from './layout';
import { AUTO_THEME_DARK, AUTO_THEME_LIGHT } from './themes';
import { contrastRatio } from './themes/test-utils';
import type { ContributionCalendar } from '../../types';

const makeEmptyCalendar = (): ContributionCalendar => ({
  totalContributions: 0,
  weeks: [{ contributionDays: [{ contributionCount: 0, date: '2024-01-01' }] }],
});

describe('Layout dark and light visual cohesion', () => {
  it('active tower top face opacity is at least 8x ghost tower top opacity', () => {
    const active = computeFaceOpacity(5, false);
    const ghost = computeFaceOpacity(0, true);
    expect(ghost.top).toBeGreaterThan(0);
    expect(active.top / ghost.top).toBeGreaterThanOrEqual(8);
    expect(active.left).toBeGreaterThan(ghost.left);
    expect(active.right).toBeGreaterThan(ghost.right);
  });

  it('ghost city and empty-day non-ghost return identical face opacities regardless of count', () => {
    const ghostZero = computeFaceOpacity(0, true);
    const ghostAny = computeFaceOpacity(500, true);
    expect(ghostZero).toEqual(ghostAny);
    expect(ghostZero).toEqual(computeFaceOpacity(0, false));
  });

  it('active tower face opacities maintain left > right depth shading ratio', () => {
    const active = computeFaceOpacity(5, false);
    expect(active.left).toBeCloseTo(0.35, 2);
    expect(active.right).toBeCloseTo(0.21, 2);
    expect(active.top).toBeCloseTo(0.7, 2);
    expect(active.top).toBeGreaterThan(active.left);
    expect(active.left).toBeGreaterThan(active.right);
  });

  it('ghost tower stroke settings are non-zero but visually minimal', () => {
    const towers = computeTowers(makeEmptyCalendar(), 'linear', '2024-01-01');
    const ghost = towers[0];
    expect(ghost.isGhost).toBe(true);
    expect(ghost.strokeOpacity).toBe(0.3);
    expect(ghost.strokeWidth).toBe(0.5);
  });

  it('auto-theme dark and light pairs satisfy WCAG AA contrast for normal text', () => {
    const darkContrast = contrastRatio(AUTO_THEME_DARK.bg, AUTO_THEME_DARK.text);
    const lightContrast = contrastRatio(AUTO_THEME_LIGHT.bg, AUTO_THEME_LIGHT.text);
    expect(darkContrast).toBeGreaterThanOrEqual(4.5);
    expect(lightContrast).toBeGreaterThanOrEqual(4.5);
  });
});
