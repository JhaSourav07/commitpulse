import { describe, expect, it } from 'vitest';
import {
  MAX_GRADIENT_STOPS,
  getGradientCoordinates,
  parseGradientStops,
  sanitizeFont,
  sanitizeGoogleFontUrl,
  sanitizeHexColor,
  sanitizeRadius,
  sanitizeSpeed,
} from './sanitizer';

const now = () => performance.now();

const validHex = (index: number) => (index % 0xffffff).toString(16).padStart(6, '0');

describe('SVG sanitizer massive scaling', () => {
  it('caps thousands of gradient stop tokens to the supported layout bound', () => {
    const gradientStops = [
      ...Array.from({ length: MAX_GRADIENT_STOPS }, (_, index) => `#${validHex(index)}`),
      ...Array.from({ length: 5000 }, (_, index) =>
        index % 2 === 0 ? validHex(index + 100) : `bad-${index}`
      ),
    ].join(',');

    const start = now();
    const stops = parseGradientStops(gradientStops);
    const duration = now() - start;

    expect(stops).toHaveLength(MAX_GRADIENT_STOPS);
    expect(stops).toEqual(
      Array.from({ length: MAX_GRADIENT_STOPS }, (_, index) => validHex(index))
    );
    expect(stops.every((stop) => /^[0-9a-f]{6}$/i.test(stop))).toBe(true);
    expect(duration).toBeLessThan(25);
  });

  it('sanitizes high-volume contributor-like color parameters without leaking unsafe tokens', () => {
    const inputs = Array.from({ length: 3000 }, (_, index) =>
      index % 4 === 0
        ? `#${validHex(index)}`
        : index % 4 === 1
          ? `"><script>${index}</script>`
          : index % 4 === 2
            ? 'rgba(255,0,0,0.5)'
            : '  abc  '
    );

    const start = now();
    const colors = inputs.map((input) => sanitizeHexColor(input, '0d1117'));
    const duration = now() - start;

    expect(colors).toHaveLength(inputs.length);
    expect(colors.every((color) => /^[0-9A-Fa-f]{3,8}$/.test(color))).toBe(true);
    expect(colors).toContain('0d1117');
    expect(colors).toContain('abc');
    expect(colors.join(',')).not.toMatch(/[<>"();]/);
    expect(duration).toBeLessThan(75);
  });

  it('clamps extreme radius and speed values to stable SVG layout ranges', () => {
    const largeMetrics = Array.from({ length: 2500 }, (_, index) => ({
      radius:
        index % 2 === 0 ? Number.MAX_SAFE_INTEGER - index : `${-Number.MAX_SAFE_INTEGER + index}`,
      speed:
        index % 4 === 0 ? `${index}s` : index % 4 === 1 ? '1.999s' : index % 4 === 2 ? '20s' : '2s',
    }));

    const start = now();
    const sanitized = largeMetrics.map(({ radius, speed }) => ({
      radius: sanitizeRadius(radius, 8),
      speed: sanitizeSpeed(speed, '8s'),
    }));
    const duration = now() - start;

    expect(sanitized).toHaveLength(largeMetrics.length);
    expect(sanitized.every(({ radius }) => radius >= 0 && radius <= 50)).toBe(true);
    expect(sanitized.map(({ radius }) => radius)).toContain(0);
    expect(sanitized.map(({ radius }) => radius)).toContain(50);
    expect(
      sanitized.every(({ speed }) => {
        const seconds = Number.parseFloat(speed);
        return /^\d+(\.\d+)?s$/.test(speed) && seconds >= 2 && seconds <= 20;
      })
    ).toBe(true);
    expect(sanitized.map(({ speed }) => speed)).toEqual(
      expect.arrayContaining(['8s', '20s', '2s'])
    );
    expect(duration).toBeLessThan(75);
  });

  it('keeps massive font lists text-safe and URL-safe for SVG text wrapping', () => {
    const fontNames = Array.from({ length: 2500 }, (_, index) =>
      index % 5 === 0
        ? `Open Sans ${index}`
        : index % 5 === 1
          ? `Font-${index}`
          : index % 5 === 2
            ? `Bad Font ${index}; @import url(http://evil.test)`
            : index % 5 === 3
              ? `<script>alert(${index})</script>`
              : '   '
    );

    const start = now();
    const sanitizedFonts = fontNames.map((font) => sanitizeFont(font));
    const fontUrls = fontNames.map((font) => sanitizeGoogleFontUrl(font));
    const duration = now() - start;

    expect(sanitizedFonts).toHaveLength(fontNames.length);
    expect(fontUrls).toHaveLength(fontNames.length);
    expect(sanitizedFonts.filter(Boolean).every((font) => !/[<>"();/@.]/.test(font!))).toBe(true);
    expect(fontUrls.filter(Boolean).every((font) => /^[a-zA-Z0-9+-]+$/.test(font!))).toBe(true);
    expect(fontUrls).toContain('Open+Sans+0');
    expect(fontUrls).toContain('Font-1');
    expect(fontUrls).toContain(null);
    expect(duration).toBeLessThan(100);
  });

  it('returns bounded gradient coordinates that cannot break browser layout trees', () => {
    const directions = Array.from({ length: 2000 }, (_, index) =>
      index % 5 === 0
        ? 'vertical'
        : index % 5 === 1
          ? 'horizontal'
          : index % 5 === 2
            ? 'diagonal'
            : index % 5 === 3
              ? '  HORIZONTAL  '
              : `invalid-${index}`
    );

    const start = now();
    const coordinates = directions.map(getGradientCoordinates);
    const duration = now() - start;

    expect(coordinates).toHaveLength(directions.length);
    expect(
      coordinates.every((coord) => Object.values(coord).every((value) => /^(0|100)%$/.test(value)))
    ).toBe(true);
    expect(coordinates).toContainEqual({ x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    expect(coordinates).toContainEqual({ x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    expect(coordinates).toContainEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
    expect(duration).toBeLessThan(50);
  });
});
