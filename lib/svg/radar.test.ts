// lib/svg/radar.test.ts

import { describe, it, expect } from 'vitest';
import { generateRadarSVG } from './radar';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

function makeMockCalendar(): ContributionCalendar {
  return {
    totalContributions: 500,
    weeks: [
      {
        contributionDays: [
          { date: '2025-01-01', contributionCount: 5 },
          { date: '2025-01-02', contributionCount: 0 },
        ],
      },
    ],
  };
}

function makeMockStats(): StreakStats {
  return {
    currentStreak: 7,
    longestStreak: 30,
    totalContributions: 500,
    todayDate: '2025-01-02',
  };
}

function makeMockParams(overrides: Partial<BadgeParams> = {}): BadgeParams {
  return {
    user: 'testuser',
    bg: '0d1117' as BadgeParams['bg'],
    text: 'c9d1d9' as BadgeParams['text'],
    accent: '58a6ff' as BadgeParams['accent'],
    speed: '8s',
    scale: 'linear',
    ...overrides,
  } as BadgeParams;
}

describe('generateRadarSVG', () => {
  it('generates a valid SVG string', () => {
    const calendar = makeMockCalendar();
    const stats = makeMockStats();
    const params = makeMockParams();

    const svg = generateRadarSVG(stats, params, calendar);

    expect(svg).toContain(
      '<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg"'
    );
    expect(svg).toContain('Contribution Radar');
    expect(svg).toContain('testuser');
  });

  it('includes radar grid levels', () => {
    const svg = generateRadarSVG(makeMockStats(), makeMockParams(), makeMockCalendar());
    expect(svg).toContain('id="cp-radar-levels"');
    expect(svg).toContain('<polygon points=');
  });

  it('includes radar axes', () => {
    const svg = generateRadarSVG(makeMockStats(), makeMockParams(), makeMockCalendar());
    expect(svg).toContain('id="cp-radar-axes"');
    expect(svg).toContain('<line x1=');
  });

  it('includes radar data polygon', () => {
    const svg = generateRadarSVG(makeMockStats(), makeMockParams(), makeMockCalendar());
    expect(svg).toContain('id="cp-radar-data"');
    expect(svg).toContain('fill-opacity="0.25"');
  });

  it('produces deterministic output for same inputs', () => {
    const calendar = makeMockCalendar();
    const params = makeMockParams({ user: 'deterministic-test' });

    const svg1 = generateRadarSVG(makeMockStats(), params, calendar);
    const svg2 = generateRadarSVG(makeMockStats(), params, calendar);

    expect(svg1).toBe(svg2);
  });

  it('includes accessibility title and desc elements', () => {
    const svg = generateRadarSVG(makeMockStats(), makeMockParams(), makeMockCalendar());

    expect(svg).toContain('<title id="cp-radar-title">');
    expect(svg).toContain('<desc id="cp-radar-desc">');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby');
  });

  it('respects custom theme colors', () => {
    const params = makeMockParams({
      bg: 'ff0000' as BadgeParams['bg'],
      text: '00ff00' as BadgeParams['text'],
      accent: '0000ff' as BadgeParams['accent'],
    });

    const svg = generateRadarSVG(makeMockStats(), params, makeMockCalendar());

    expect(svg).toContain('fill="#ff0000"'); // background
    expect(svg).toContain('fill="#00ff00"'); // text elements
    expect(svg).toContain('fill="#0000ff"'); // accent
  });
});
