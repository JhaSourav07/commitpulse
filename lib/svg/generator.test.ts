import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';

describe('generateSVG', () => {
  const mockStats = {} as unknown;
  const mockCalendar = { weeks: [] } as unknown;

  it('uses default typography when no font is passed', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown, mockCalendar);

    expect(svg).toContain('Syncopate');
    expect(svg).toContain('Space Grotesk');
  });

  it('applies custom font when font is provided', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'jetbrains' } as unknown,
      mockCalendar
    );

    expect(svg).toContain('JetBrains Mono');
  });

  it('handles radius=0 correctly', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', radius: 0 } as unknown,
      mockCalendar
    );

    expect(svg).toContain('rx="0"');
  });
});