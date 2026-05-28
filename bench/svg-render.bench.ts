import { bench, describe, expect } from 'vitest';
import { generateSVG } from '../lib/svg/generator';

describe('SVG Generation Performance', () => {
  const mockStats = {
    totalContributions: 150,
    contributionCalendar: Array(98).fill({ contributionCount: 2 }),
  };

  bench('render standard 3D monolith', async () => {
    const start = performance.now();
    generateSVG(mockStats, { theme: 'dark', size: 'medium' });
    const end = performance.now();
    
    // Performance Budget: Fail if rendering takes longer than 100ms
    const duration = end - start;
    expect(duration).toBeLessThan(100); 
  });
});
