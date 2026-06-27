// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { SOCIALS, getSocialById } from './socials';
import type { Social } from '../types';

describe('Socials Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('1. should handle iteration over massive arrays of social entries without overflow', () => {
    const massiveList: Social[] = Array.from({ length: 10_000 }, (_, i) => ({
      ...SOCIALS[i % SOCIALS.length],
      id: `social-${i}`,
    }));

    expect(massiveList.length).toBe(10_000);
    massiveList.forEach((entry) => {
      expect(entry.id).toBeTruthy();
    });
  });

  it('2. should construct highly loaded socialLinks config without crashing', () => {
    const baseUrl = 'https://github.com/';
    const maxUrl = baseUrl + 'x'.repeat(2048 - baseUrl.length); // exactly 2048 chars
    const selectedSocials = Array.from({ length: 10_000 }, (_, i) => `social-${i}`);
    const socialLinks: Record<string, string> = {};
    selectedSocials.forEach((id) => {
      socialLinks[id] = maxUrl;
    });

    Object.values(socialLinks).forEach((url) => {
      expect(url.length).toBeLessThanOrEqual(2048);
    });
    expect(Object.keys(socialLinks).length).toBe(10_000);
  });

  it('3. should assert SVG grid coordinates do not overlap across all 52 real social entries', () => {
    const ICON_SIZE = 64;
    const COLS = 8;
    const viewBoxWidth = COLS * ICON_SIZE; // 512

    const positions = SOCIALS.map((_, i) => ({
      x: (i % COLS) * ICON_SIZE,
      y: Math.floor(i / COLS) * ICON_SIZE,
    }));

    const keys = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(keys.size).toBe(SOCIALS.length); // no overlaps

    positions.forEach((p) => {
      expect(p.x).toBeLessThan(viewBoxWidth);
      expect(p.x).toBeGreaterThanOrEqual(0);
    });
  });

  it('4. should complete 100,000 getSocialById lookups within 1500ms', () => {
    const ids = SOCIALS.map((s) => s.id);
    const start = performance.now();

    for (let i = 0; i < 100_000; i++) {
      getSocialById(ids[i % ids.length]);
    }

    const elapsed = performance.now() - start;
    // Set a generous threshold (1500ms) to ensure timing is stable across virtualized CI runners
    expect(elapsed).toBeLessThan(1500);
  });

  it('5. should parse a massive social icon SVG grid without layout tree errors', () => {
    const COLS = 8;
    const SIZE = 64;

    const rects = SOCIALS.map((s, i) => {
      const x = (i % COLS) * SIZE;
      const y = Math.floor(i / COLS) * SIZE;
      return `<rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" /><text x="${x + 4}" y="${y + 20}">${s.name.slice(0, 12)}</text>`;
    }).join('');

    const svg = `<svg viewBox="0 0 ${COLS * SIZE} ${Math.ceil(SOCIALS.length / COLS) * SIZE}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    expect(doc.getElementsByTagName('parsererror').length).toBe(0);
    expect(doc.getElementsByTagName('rect').length).toBe(SOCIALS.length);
  });
});
