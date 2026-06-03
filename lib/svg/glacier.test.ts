import { describe, it, expect } from 'vitest';
import { themes } from './themes';
import { generateSVG } from './generator';
import type { StreakStats, ContributionCalendar, BadgeParams } from '../../types/index';

const mockStats: StreakStats = {
  currentStreak: 5,
  longestStreak: 10,
  totalContributions: 120,
  todayDate: '2024-06-01',
};

const mockCalendar: ContributionCalendar = {
  totalContributions: 120,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-05-26' },
        { contributionCount: 0, date: '2024-05-27' },
        { contributionCount: 5, date: '2024-05-28' },
        { contributionCount: 2, date: '2024-05-29' },
        { contributionCount: 4, date: '2024-05-30' },
        { contributionCount: 1, date: '2024-05-31' },
        { contributionCount: 6, date: '2024-06-01' },
      ],
    },
  ],
};

const glacierAccent = Array.isArray(themes.glacier.accent)
  ? themes.glacier.accent[0]
  : themes.glacier.accent;

const mockParams = {
  user: 'octocat',
  bg: themes.glacier.bg,
  text: themes.glacier.text,
  accent: glacierAccent,
  size: 'medium',
  scale: 'linear',
  grace: 1,
  refresh: false,
  hide_title: false,
  hide_background: false,
  hide_stats: false,
  lang: 'en',
  view: 'default',
  delta_format: 'percent',
  mode: 'commits',
  entrance: 'rise',
  format: 'svg',
  radius: 8,
  speed: '8s',
  opacity: 1.0,
  labels: false,
  shading: false,
  gradient: false,
  disable_particles: false,
  glow: true,
} as BadgeParams;

const HEX_REGEX = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('glacier theme', () => {
  it('exists as a key in the themes object', () => {
    expect(Object.hasOwn(themes, 'glacier')).toBe(true);
  });

  it('has valid hex color strings for bg, text, and accent', () => {
    const { bg, text, accent } = themes.glacier;
    const accentStr = Array.isArray(accent) ? accent[0] : accent;
    expect(HEX_REGEX.test(bg)).toBe(true);
    expect(HEX_REGEX.test(text)).toBe(true);
    expect(HEX_REGEX.test(accentStr)).toBe(true);
  });

  it('has the correct specific color values', () => {
    expect(themes.glacier.bg).toBe('e0f2fe');
    expect(themes.glacier.text).toBe('0369a1');
    expect(glacierAccent).toBe('06b6d4');
  });

  it('meets WCAG AA contrast ratio (≥ 4.5) between bg and text', () => {
    const ratio = contrastRatio(themes.glacier.bg, themes.glacier.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('generates SVG output containing the glacier theme hex colors', () => {
    const svg = generateSVG(mockStats, mockParams, mockCalendar);
    expect(typeof svg).toBe('string');
    expect(svg.length).toBeGreaterThan(100);
    expect(svg).toMatch(new RegExp(`#?${glacierAccent}`, 'i'));
    expect(svg).toContain('<svg');
  });
});
