import { describe, expect, it } from 'vitest';
import {
  sanitizeHexColor,
  sanitizeFont,
  sanitizeGoogleFontUrl,
  normalizeHexColor,
  parseGradientStops,
  getGradientCoordinates,
} from './sanitizer';

describe('SVG Sanitizer Accessibility', () => {
  it('returns safe hex colors for accessible SVG label styling', () => {
    expect(sanitizeHexColor('#4a90e2', '000000')).toBe('4a90e2');
    expect(sanitizeHexColor('##4a90e2', '000000')).toBe('4a90e2');
    expect(sanitizeHexColor('invalid-color', 'ffffff')).toBe('ffffff');
  });

  it('filters unsafe font names while preserving accessible text labels', () => {
    expect(sanitizeFont('Open Sans')).toBe('Open Sans');
    expect(sanitizeFont('Arial-Bold')).toBe('Arial-Bold');
    expect(sanitizeFont('Inter<script>alert(1)</script>')).toBe('Interscriptalert1script');
  });

  it('rejects unsafe Google Font names for secure external font loading', () => {
    expect(sanitizeGoogleFontUrl('Roboto')).toBe('Roboto');
    expect(sanitizeGoogleFontUrl('Open Sans')).toBe('Open+Sans');
    expect(sanitizeGoogleFontUrl('Open Sans; @import url(http://evil.com)')).toBe(null);
  });

  it('preserves gradient stop order for predictable accessible narration', () => {
    expect(parseGradientStops('#ff0000,#00ff00,0000ff')).toEqual(['ff0000', '00ff00', '0000ff']);
    expect(parseGradientStops('invalid,#abc,123456')).toEqual(['abc', '123456']);
  });

  it('maps gradient directions to stable coordinate pairs for accessible rendering', () => {
    expect(getGradientCoordinates('horizontal')).toEqual({
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '0%',
    });
    expect(getGradientCoordinates('diagonal')).toEqual({
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
    });
    expect(getGradientCoordinates('unknown')).toEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  });
});
