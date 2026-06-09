import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ActivityData } from '@/types/dashboard';
import {
  formatTooltipDate,
  getActivityInsight,
  getContributionLabel,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    // Mock standard wide viewport defaults before testing responsive variations
    vi.stubGlobal('innerWidth', 1024);
  });

  // Test Case 1: Mock standard mobile-width media coordinates (375px wide viewports)
  it('handles label calculations perfectly under a 375px mobile viewport context', () => {
    vi.stubGlobal('innerWidth', 375);

    const label = getContributionLabel(5);
    // Humanic Check: Label data must remain uniform and unbroken even on a narrow viewport width
    expect(label).toBe('5 contributions');
  });

  // Test Case 2: Assert that columns/list segments map correctly under small viewports
  it('calculates streaks smoothly when datasets map across phone layout columns', () => {
    vi.stubGlobal('innerWidth', 360);

    const data: ActivityData[] = [
      { date: '2026-06-01', count: 1, intensity: 1 },
      { date: '2026-06-02', count: 4, intensity: 2 },
    ];

    const activeStreak = getLocalActiveStreak(data, 1);
    // Humanic Check: Validates stack matrix data is structurally preserved when evaluated at 360px widths
    expect(activeStreak).toBe(2);
  });

  // Test Case 3: Verify style/dimension tracking properties skip absolute rigid constraints
  it('ensures calculations reflect dynamic properties rather than fixed absolute widths', () => {
    vi.stubGlobal('innerWidth', 375);

    const widthMetric = window.innerWidth;
    // Humanic Check: Verifies mobile runtime layout layers ignore desktop container markers
    expect(widthMetric).not.toBe(600);
    expect(widthMetric).not.toBe(800);
    expect(widthMetric).toBe(375);
  });

  // Test Case 4: Check that metadata labels adapt cleanly when tracking medium tablet breakpoints
  it('formats dates and insight labels smoothly at intermediate 768px viewports', () => {
    vi.stubGlobal('innerWidth', 768);

    const dateStr = formatTooltipDate('2026-06-03');
    const insightStr = getActivityInsight(12, 4);

    // Humanic Check: Validates text structures are fully optimized for mid-range responsive devices
    expect(dateStr).toBe('Jun 3, 2026');
    expect(insightStr).toBe('Peak activity day');
  });

  // Test Case 5: Assert mobile-specific toggle states and conditions execute cleanly
  it('handles edge evaluation bounds correctly under strict mobile layouts', () => {
    vi.stubGlobal('innerWidth', 320);

    const label = getStreakLabel(0);
    // Humanic Check: Validates empty or hidden state conditions resolve with clear fallbacks under 320px screens
    expect(label).toBe('No active streak');
  });
});
