import { describe, it, expect } from 'vitest';
import { generateLeetCodeSVG, getLeetCodeTheme } from './leetcode';
import type { LeetCodeStatData } from '../../services/leetcode/api';
import { leetcodeParamsSchema } from '../validations';

describe('LeetCode SVG Generator', () => {
  const defaultParams = leetcodeParamsSchema.parse({ username: 'testuser' });

  it('renders error state correctly', () => {
    const stats: LeetCodeStatData = {
      username: 'testuser',
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 0,
      error: 'User not found',
    };
    const svg = generateLeetCodeSVG(stats, defaultParams);
    expect(svg).toContain('LeetCode Stats');
    expect(svg).toContain('User not found');
  });

  it('renders full stats correctly', () => {
    const stats: LeetCodeStatData = {
      username: 'john_doe',
      totalSolved: 500,
      easySolved: 200,
      mediumSolved: 250,
      hardSolved: 50,
      ranking: 15420,
    };

    const svg = generateLeetCodeSVG(stats, defaultParams);

    expect(svg).toContain("john_doe's LeetCode Stats");
    expect(svg).toContain('Rank #15,420');
    expect(svg).toContain('Total Solved');
    expect(svg).toContain('500');
    expect(svg).toContain('Easy');
    expect(svg).toContain('200');
    expect(svg).toContain('Medium');
    expect(svg).toContain('250');
    expect(svg).toContain('Hard');
    expect(svg).toContain('50');
  });

  it('supports theme customization', () => {
    const customParams = leetcodeParamsSchema.parse({
      username: 'testuser',
      theme: 'dracula',
      bg: '1e1e2e',
      text: 'f5e0dc',
      accent: 'cba6f7',
    });

    const theme = getLeetCodeTheme(customParams);
    expect(theme.bg).toBe('1e1e2e');
    expect(theme.text).toBe('f5e0dc');
    expect(theme.accent).toBe('cba6f7');

    const stats: LeetCodeStatData = {
      username: 'testuser',
      totalSolved: 10,
      easySolved: 5,
      mediumSolved: 3,
      hardSolved: 2,
      ranking: 100,
    };

    const svg = generateLeetCodeSVG(stats, customParams);
    expect(svg).toContain('fill="#1e1e2e"');
  });
});
