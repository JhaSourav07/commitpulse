import { bench, describe, expect } from 'vitest';
import { generateSVG } from '../lib/svg/generator';

describe('SVG Generation Performance', () => {
  const mockStats = {
    totalContributions: 150,
  };
  
  // Create a mock calendar array
  const mockCalendar = Array(98).fill({ contributionCount: 2 });

  bench('render standard 3D monolith', async () => {
    const start = performance.now();
    
    // Provide the 3 required arguments
    generateSVG(mockStats, mockCalendar, { 
      theme: 'dark', 
      size: 'medium' 
    });
    
    const end = performance.now();
<<<<<<< HEAD
    
    // Performance Budget: Fail if rendering takes longer than 100ms
    const duration = end - start;
    expect(duration).toBeLessThan(100); 
=======
    expect(end - start).toBeLessThan(100);
>>>>>>> f63ec13 (Refactor SVG benchmark to include mock calendar)
  });
});
