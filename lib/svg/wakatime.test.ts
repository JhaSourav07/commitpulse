import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { generateWakaTimeSVG } from './wakatime';
import type { WakaTimeStatData } from '../../services/wakatime/api';
import { wakatimeParamsSchema } from '../validations';

// Infer the type directly from the schema to fix the import error
type WakatimeParams = z.infer<typeof wakatimeParamsSchema>;

describe('WakaTime SVG Generator', () => {
  const defaultParams = wakatimeParamsSchema.parse({});

  it('renders "Not Configured" state', () => {
    const svg = generateWakaTimeSVG({ isConfigured: false }, defaultParams);
    expect(svg).toContain('WakaTime Not Configured');
    expect(svg).toContain('class="title"');
  });

  it('renders "No Data Available" state', () => {
    const svg = generateWakaTimeSVG({ isConfigured: true }, defaultParams);
    expect(svg).toContain('No Data Available');
  });

  it('renders full stats correctly', () => {
    const stats: WakaTimeStatData = {
      isConfigured: true,
      totalSeconds: 36000,
      humanReadableTotal: '10 hrs 0 mins',
      languages: [
        { name: 'TypeScript', percent: 60.5, total_seconds: 21600, text: '6 hrs' },
        { name: 'JavaScript', percent: 39.5, total_seconds: 14400, text: '4 hrs' },
      ],
    };

    const svg = generateWakaTimeSVG(stats, defaultParams);

    expect(svg).toContain('WakaTime Stats (Last 7 Days)');
    expect(svg).toContain('10 hrs 0 mins');
    expect(svg).toContain('TypeScript');
    expect(svg).toContain('60.5%');
    expect(svg).toContain('JavaScript');
    expect(svg).toContain('39.5%');
  });

  it('[Bug fix] the full 5-language legend fits within the viewBox at the minimum allowed height', () => {
    const stats: WakaTimeStatData = {
      isConfigured: true,
      totalSeconds: 36000,
      humanReadableTotal: '10 hrs',
      languages: [
        { name: 'TypeScript', percent: 40, total_seconds: 14400, text: '4 hrs' },
        { name: 'Python', percent: 25, total_seconds: 9000, text: '2.5 hrs' },
        { name: 'Go', percent: 15, total_seconds: 5400, text: '1.5 hrs' },
        { name: 'Rust', percent: 12, total_seconds: 4320, text: '1.2 hrs' },
        { name: 'CSS', percent: 8, total_seconds: 2880, text: '0.8 hrs' },
      ],
    };

    const minHeight = 150;
    const svg = generateWakaTimeSVG(stats, { height: minHeight } as WakatimeParams);

    // Extract all y-coordinates from the generated SVG
    const yValues = Array.from(svg.matchAll(/y="(\d+)"/g)).map((m) => Number(m[1]));

    // Ensure no element is drawn below the canvas boundary
    for (const y of yValues) {
      expect(y).toBeLessThan(minHeight);
    }
  });
});
