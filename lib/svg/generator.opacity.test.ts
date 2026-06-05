// lib/svg/generator.opacity.test.ts
// Tests for the ?opacity= URL parameter — Issue #

import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

const mockStats: StreakStats = {
  currentStreak: 5,
  longestStreak: 10,
  totalContributions: 100,
  todayDate: '2024-06-12',
};

const mockCalendar: ContributionCalendar = {
  totalContributions: 100,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-10' },
        { contributionCount: 8, date: '2024-06-11' },
        { contributionCount: 5, date: '2024-06-12' },
      ],
    },
  ],
};

describe('?opacity= parameter', () => {
  it('defaults to fully opaque (fill-opacity values unchanged) when opacity is omitted', () => {
    const svgDefault = generateSVG(
      mockStats,
      { user: 'chetan' } as unknown as BadgeParams,
      mockCalendar
    );
    const svgExplicit1 = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 1.0 } as unknown as BadgeParams,
      mockCalendar
    );
    // Both should produce identical output
    expect(svgDefault).toBe(svgExplicit1);
  });

  it('applies opacity=0.5 scalar — fill-opacity values are halved', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 0.5 } as unknown as BadgeParams,
      mockCalendar
    );
    // With opacity=0.5, tower fill-opacity should not exceed 0.5
    // (0.7 * 0.5 = 0.35 max for top face)
    const towerMatches = [
      ...svg.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"[^>]*>/g),
    ];
    const towerFaces = towerMatches.filter((match) => !match[0].includes('fill="white"'));
    expect(towerFaces.length).toBeGreaterThan(0);
    for (const match of towerFaces) {
      expect(parseFloat(match[1])).toBeLessThanOrEqual(0.5);
    }
  });

  it('opacity=1.0 produces fill-opacity values identical to the default', () => {
    const svgDefault = generateSVG(
      mockStats,
      { user: 'chetan' } as unknown as BadgeParams,
      mockCalendar
    );
    const svgOpacity1 = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 1.0 } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svgDefault).toBe(svgOpacity1);
  });

  it('opacity=0.8 produces fill-opacity values all at or below 0.8', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 0.8 } as unknown as BadgeParams,
      mockCalendar
    );
    // Tower fill-opacity values should respect opacity parameter
    const towerMatches = [
      ...svg.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"[^>]*>/g),
    ];
    const towerFaces = towerMatches.filter((match) => !match[0].includes('fill="white"'));
    expect(towerFaces.length).toBeGreaterThan(0);
    for (const match of towerFaces) {
      expect(parseFloat(match[1])).toBeLessThanOrEqual(0.8);
    }
  });

  it('opacity=0.1 (minimum) produces very low fill-opacity values', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 0.1 } as unknown as BadgeParams,
      mockCalendar
    );
    // Find tower fill-opacity values (in <path> elements with fill-opacity)
    // The towers should have opacity values <= 0.1 (0.7 * 0.1 = 0.07 max for top face)
    const towerMatches = [
      ...svg.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"[^>]*>/g),
    ];
    const towerFaces = towerMatches.filter((match) => !match[0].includes('fill="white"'));
    expect(towerFaces.length).toBeGreaterThan(0);
    for (const match of towerFaces) {
      expect(parseFloat(match[1])).toBeLessThanOrEqual(0.1);
    }
  });

  it('different opacity values produce different SVG output', () => {
    const svgFull = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 1.0 } as unknown as BadgeParams,
      mockCalendar
    );
    const svgHalf = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 0.5 } as unknown as BadgeParams,
      mockCalendar
    );
    // Different opacity should produce different SVG (tower fill-opacity values differ)
    expect(svgFull).not.toBe(svgHalf);
    // Verify the tower opacities are actually different
    const towerMatches1 = [
      ...svgFull.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"/g),
    ];
    const towerMatches2 = [
      ...svgHalf.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"/g),
    ];
    expect(towerMatches1.length).toBeGreaterThan(0);
    expect(towerMatches2.length).toBeGreaterThan(0);
    // The average opacity should be higher for full opacity
    const avg1 = towerMatches1.reduce((sum, m) => sum + parseFloat(m[1]), 0) / towerMatches1.length;
    const avg2 = towerMatches2.reduce((sum, m) => sum + parseFloat(m[1]), 0) / towerMatches2.length;
    expect(avg1).toBeGreaterThan(avg2);
  });

  it('opacity works correctly in auto-theme mode', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 0.5, autoTheme: true } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('--cp-bg');
    // Check tower fill-opacity values
    const towerMatches = [
      ...svg.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"[^>]*>/g),
    ];
    const towerFaces = towerMatches.filter((match) => !match[0].includes('fill="white"'));
    for (const match of towerFaces) {
      expect(parseFloat(match[1])).toBeLessThanOrEqual(0.5);
    }
  });

  it('opacity is rounded to 2 decimal places to avoid floating point noise', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'chetan', opacity: 0.333 } as unknown as BadgeParams,
      mockCalendar
    );
    // fill-opacity values should not have more than 2 decimal places
    const towerMatches = [
      ...svg.matchAll(/<path[^>]*d="M0[^"]*"[^>]*fill-opacity="([\d.]+)"[^>]*>/g),
    ];
    const towerFaces = towerMatches.filter((match) => !match[0].includes('fill="white"'));
    for (const match of towerFaces) {
      const val = match[1];
      const decimalPlaces = val.includes('.') ? val.split('.')[1].length : 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    }
  });
});

describe('toOpacityValue validation', () => {
  it('returns 1.0 when opacity param is missing', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(1.0);
  });

  it('parses valid opacity=0.5 correctly', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: '0.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(0.5);
  });

  it('clamps opacity below 0.1 to 0.1', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: '0.0' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(0.1);
  });

  it('clamps opacity above 1.0 to 1.0', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: '2.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(1.0);
  });

  it('returns 1.0 for non-numeric opacity value', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: 'abc' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(1.0);
  });

  it('accepts opacity=1.0 exactly', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: '1.0' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(1.0);
  });

  it('accepts opacity=0.1 exactly (minimum boundary)', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: '0.1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(0.1);
  });

  it('accepts negative opacity and clamps to 0.1', async () => {
    const { streakParamsSchema } = await import('../validations');
    const result = streakParamsSchema.safeParse({ user: 'chetan', opacity: '-0.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opacity).toBe(0.1);
  });
});
