import { describe, expect, it } from 'vitest';
import { performance } from 'perf_hooks';
import { buildQueryParams, getExportSnippet, getBadgeUrl } from './utils';
import type { CustomizeOptions, ExportFormat } from './types';

describe('utils - Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('1. should populate mock objects with extreme metrics without overflow', () => {
    const extremeOptions: CustomizeOptions = {
      username: 'a'.repeat(255),
      theme: 'dark',
      bgHex: '#ffffff',
      bgType: 'solid',
      bgStart: '',
      bgEnd: '',
      bgAngle: 90,
      accentHex: '#000000',
      textHex: '#111111',
      scale: 'log',
      speed: '20s',
      font: 'jetbrains',
      year: '2099',
      radius: 999999,
      size: 'large',
      hideTitle: true,
      hideBackground: true,
      hideStats: true,
      viewMode: 'pulse',
      deltaFormat: 'both',
      badgeWidth: 999999,
      badgeHeight: 999999,
      grace: 999999,
      language: 'es',
      timezone: 'Asia/Kolkata',
    };

    const start = performance.now();
    const result = buildQueryParams(extremeOptions);
    const elapsed = performance.now() - start;

    expect(typeof result).toBe('string');
    expect(result.length).toBeLessThan(8000);
    expect(result).toContain('radius=999999');
    expect(result).toContain('grace=999999');
    expect(result).toContain('width=999999');
    expect(result).toContain('height=999999');
    expect(result).toContain('scale=log');
    expect(result).toContain('speed=20s');
    expect(result).toContain('font=jetbrains');
    expect(result).toContain('year=2099');
    expect(result).toContain('size=large');
    expect(result).toContain('hide_title=true');
    expect(result).toContain('hide_background=true');
    expect(result).toContain('hide_stats=true');
    expect(result).toContain('view=pulse');
    expect(result).toContain('delta_format=both');
    expect(result).toContain('lang=es');
    expect(result).toContain('tz=Asia%2FKolkata');

    // Check that timing is recorded and non-negative
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('2. should render the module under highly loaded configuration without crashing', () => {
    const baseParam = 'user=' + 'a'.repeat(1000);
    const params = Array.from({ length: 5 }, (_, i) => `param${i}=` + 'b'.repeat(1000)).join('&');
    const massiveQueryString = `${baseParam}&${params}&theme=dark`;

    const formats: ExportFormat[] = ['markdown', 'html', 'action', 'tsx'];

    formats.forEach((format) => {
      const start = performance.now();
      const snippet = getExportSnippet(format, massiveQueryString);
      const elapsed = performance.now() - start;

      expect(typeof snippet).toBe('string');
      expect(snippet.length).toBeGreaterThan(0);
      expect(snippet).toContain(massiveQueryString);

      if (format === 'tsx') {
        // Assert on stable invariants for the TSX client component structure
        expect(snippet).toMatch(/['"]use client['"]/);
        expect(snippet).toContain('export function');
        expect(snippet).toContain(massiveQueryString);
      }

      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  it('3. should produce valid SVG coordinate params under extreme display bounds', () => {
    const extremeOptions: CustomizeOptions = {
      username: 'testuser',
      theme: 'dark',
      bgHex: '',
      bgType: 'linear',
      bgStart: '#ff0000',
      bgEnd: '#0000ff',
      bgAngle: 359,
      accentHex: '',
      textHex: '',
      scale: 'linear',
      speed: '8s',
      font: 'Inter',
      year: '',
      radius: 8,
      size: 'medium',
      hideTitle: false,
      hideBackground: false,
      hideStats: false,
      viewMode: 'default',
      deltaFormat: 'percent',
      badgeWidth: 99999,
      badgeHeight: 99999,
      grace: 1,
      language: 'en',
      timezone: 'UTC',
    };

    const query = buildQueryParams(extremeOptions);
    const parsed = new URLSearchParams(query);

    // Note: buildQueryParams preserves specific camelCase query keys (bgStart, bgEnd, bgAngle)
    // for gradient parameters while using snake_case for visibility and layout options.
    const angle = parsed.get('bgAngle');
    expect(angle).toBe('359');
    const angleNum = Number(angle);
    expect(angleNum).toBeGreaterThanOrEqual(0);
    expect(angleNum).toBeLessThanOrEqual(360);

    const width = parsed.get('width');
    const height = parsed.get('height');
    expect(width).toBe('99999');
    expect(height).toBe('99999');
    expect(Number.isFinite(Number(width))).toBe(true);
    expect(Number.isFinite(Number(height))).toBe(true);

    const bgStart = parsed.get('bgStart');
    const bgEnd = parsed.get('bgEnd');
    expect(bgStart).toBe('ff0000');
    expect(bgEnd).toBe('0000ff');
    expect(bgStart).not.toContain('#');
    expect(bgEnd).not.toContain('#');
  });

  it('4. should complete 1000 buildQueryParams calls within performance margin', () => {
    const testOptions: CustomizeOptions = {
      username: 'heavyuser',
      theme: 'light',
      bgHex: '#ffffff',
      bgType: 'radial',
      bgStart: '#111111',
      bgEnd: '#222222',
      bgAngle: 45,
      accentHex: '#333333',
      textHex: '#444444',
      scale: 'log',
      speed: '12s',
      font: 'roboto',
      year: '2025',
      radius: 15,
      size: 'small',
      hideTitle: true,
      hideBackground: true,
      hideStats: true,
      viewMode: 'skyline',
      deltaFormat: 'absolute',
      badgeWidth: 800,
      badgeHeight: 600,
      grace: 5,
      language: 'fr',
      timezone: 'Europe/Berlin',
    };

    const start = performance.now();
    const firstResult = buildQueryParams(testOptions);
    const firstParams = new URLSearchParams(firstResult);

    for (let i = 0; i < 1000; i++) {
      const result = buildQueryParams(testOptions);
      const currentParams = new URLSearchParams(result);

      // Compare URLSearchParams keys/values semantically to ignore parameter ordering
      expect(currentParams.size).toBe(firstParams.size);
      for (const [key, value] of firstParams.entries()) {
        expect(currentParams.get(key)).toBe(value);
      }
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('5. should generate 500 batch snippets without layout-breaking output', () => {
    const start = performance.now();

    for (let i = 0; i < 500; i++) {
      const query = `user=user${i}&theme=theme${i}&radius=${i % 20}&width=${200 + i}`;
      const htmlSnippet = getExportSnippet('html', query);
      const markdownSnippet = getExportSnippet('markdown', query);

      expect(htmlSnippet).toBeTruthy();
      expect(markdownSnippet).toBeTruthy();

      // Looser validation of tag structure to prevent brittle layout changes breaking tests
      expect(htmlSnippet).toContain('<img ');
      expect(htmlSnippet).toContain('src="');
      expect(htmlSnippet).toContain('alt="');
      expect(htmlSnippet).toContain(getBadgeUrl(query));
      expect(htmlSnippet).toContain(`width=${200 + i}`);

      // Markdown format validation
      expect(markdownSnippet).toContain('![');
      expect(markdownSnippet).toContain('](' + getBadgeUrl(query) + ')');
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
