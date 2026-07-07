import { describe, it, expect } from 'vitest';
import { SNAKE_SAMPLE_PREVIEW_SRC, PACMAN_SAMPLE_PREVIEW_SRC } from './samplePreviewGraphs';

describe('samplePreviewGraphs', () => {
  it('SNAKE_SAMPLE_PREVIEW_SRC is a valid SVG data URI', () => {
    expect(SNAKE_SAMPLE_PREVIEW_SRC).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });

  it('PACMAN_SAMPLE_PREVIEW_SRC is a valid SVG data URI', () => {
    expect(PACMAN_SAMPLE_PREVIEW_SRC).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });

  it('decodes back into well-formed SVG markup for the snake preview', () => {
    const decoded = decodeURIComponent(
      SNAKE_SAMPLE_PREVIEW_SRC.replace('data:image/svg+xml;charset=utf-8,', '')
    );
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('</svg>');
    expect(decoded).toContain('viewBox=');
  });

  it('decodes back into well-formed SVG markup for the pacman preview', () => {
    const decoded = decodeURIComponent(
      PACMAN_SAMPLE_PREVIEW_SRC.replace('data:image/svg+xml;charset=utf-8,', '')
    );
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('</svg>');
    expect(decoded).toContain('<path'); // pacman mouth wedge
  });

  it('the two sample previews are different from each other', () => {
    expect(SNAKE_SAMPLE_PREVIEW_SRC).not.toBe(PACMAN_SAMPLE_PREVIEW_SRC);
  });

  it('produces deterministic output (same module import, same string)', async () => {
    const mod2 = await import('./samplePreviewGraphs');
    expect(mod2.SNAKE_SAMPLE_PREVIEW_SRC).toBe(SNAKE_SAMPLE_PREVIEW_SRC);
    expect(mod2.PACMAN_SAMPLE_PREVIEW_SRC).toBe(PACMAN_SAMPLE_PREVIEW_SRC);
  });
});
