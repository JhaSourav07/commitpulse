import { describe, it, expect } from 'vitest';
import { generateWakaTimeSVG } from './wakatime';
import type { WakaTimeStatData } from '../../services/wakatime/api';
import { wakatimeParamsSchema } from '../validations';

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
});
