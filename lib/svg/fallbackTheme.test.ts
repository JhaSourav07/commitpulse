import { describe, it, expect } from 'vitest';
import { resolveErrorTheme } from './themes';
import { buildInlineErrorSVG } from './generator';

describe('Visually Themed Fallback SVGs (#7796)', () => {
  describe('resolveErrorTheme', () => {
    it('uses default colors when no params are provided', () => {
      const theme = resolveErrorTheme(null);
      expect(theme.bg).toBe('#0d1117');
      expect(theme.text).toBe('#ffffff');
      expect(theme.accent).toBe('#2da44e');
      expect(theme.radius).toBe(8);
    });

    it('resolves theme colors when theme parameter is provided', () => {
      const params = new URLSearchParams('theme=dracula');
      const theme = resolveErrorTheme(params);
      expect(theme.bg).toBe('#282a36');
      expect(theme.text).toBe('#f8f8f2');
      expect(theme.accent).toBe('#bd93f9');
    });

    it('allows explicit bg, accent, and text parameter overrides', () => {
      const params = new URLSearchParams('theme=nord&bg=112233&accent=ff00aa');
      const theme = resolveErrorTheme(params);
      expect(theme.bg).toBe('#112233');
      expect(theme.accent).toBe('#ff00aa');
      expect(theme.text).toBe('#d8dee9'); // from nord theme base
    });

    it('sanitizes radius and speed parameters', () => {
      const params = new URLSearchParams('radius=16&speed=5s');
      const theme = resolveErrorTheme(params);
      expect(theme.radius).toBe(16);
      expect(theme.speed).toBe('5s');
    });

    it('handles raw object dictionary query params', () => {
      const theme = resolveErrorTheme({ theme: 'tokyonight', radius: '12' });
      expect(theme.bg).toBe('#1a1b26');
      expect(theme.accent).toBe('#f7768e');
      expect(theme.radius).toBe(12);
    });
  });

  describe('buildInlineErrorSVG', () => {
    it('renders SVG with requested theme background and accent colors', () => {
      const svg = buildInlineErrorSVG('Rate Limit Exceeded', {
        bg: '#282a36',
        accent: '#bd93f9',
        text: '#f8f8f2',
        radius: 12,
      });

      expect(svg).toContain('fill="#282a36"');
      expect(svg).toContain('stroke="#bd93f9"');
      expect(svg).toContain('fill="#f8f8f2"');
      expect(svg).toContain('rx="12"');
      expect(svg).toContain('Rate Limit Exceeded');
    });

    it('falls back to default colors if options are omitted', () => {
      const svg = buildInlineErrorSVG('Validation Error');
      expect(svg).toContain('fill="#0d1117"');
      expect(svg).toContain('stroke="#00ffaa"');
      expect(svg).toContain('Validation Error');
    });
  });
});
