import { describe, it, expect } from 'vitest';
import { injectStaleWatermark, hasStaleWatermark } from './staleWatermark';

describe('injectStaleWatermark', () => {
  const sampleSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';

  it('inserts the watermark group before the closing </svg> tag', () => {
    const result = injectStaleWatermark(sampleSvg);
    expect(result).toContain('commitpulse-stale-badge');
    expect(result.indexOf('commitpulse-stale-badge')).toBeLessThan(result.indexOf('</svg>'));
  });

  it('returns the input unchanged if there is no closing </svg> tag', () => {
    const malformed = '<svg xmlns="http://www.w3.org/2000/svg">';
    expect(injectStaleWatermark(malformed)).toBe(malformed);
  });

  it('preserves all original SVG content', () => {
    const result = injectStaleWatermark(sampleSvg);
    expect(result).toContain('width="100"');
    expect(result).toContain('height="100"');
  });
});

describe('hasStaleWatermark', () => {
  it('returns false for an SVG without the watermark', () => {
    expect(hasStaleWatermark('<svg></svg>')).toBe(false);
  });

  it('returns true after injectStaleWatermark has been applied', () => {
    const svg = injectStaleWatermark('<svg></svg>');
    expect(hasStaleWatermark(svg)).toBe(true);
  });
});
