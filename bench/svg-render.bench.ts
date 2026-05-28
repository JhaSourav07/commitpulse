import { bench, describe } from 'vitest';
import { generateSVG } from '../lib/svg/generator';

describe('SVG Generation Performance', () => {
  // Mock data representing a typical contribution calendar
  const mockStats = {
    totalContributions: 150,
    contributionCalendar: Array(98).fill({ contributionCount: 2 }),
  };

  bench('render standard 3D monolith', () => {
    generateSVG(mockStats, { 
      theme: 'dark',
      size: 'medium' 
    });
  });
});
