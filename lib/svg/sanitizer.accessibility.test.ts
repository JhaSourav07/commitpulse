import { describe, expect, it } from 'vitest';
import {
  sanitizeHexColor,
  sanitizeSpeed,
  getLuminance,
  escapeXML,
  sanitizeGoogleFontUrl,
} from './sanitizer';

describe('sanitizer Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('provides safe fallback colors to ensure visual elements remain visible accessibly', () => {
    expect(sanitizeHexColor('invalid', '000000')).toBe('000000');
    expect(sanitizeHexColor(undefined, '123456')).toBe('123456');
    expect(sanitizeHexColor('#abcdef', '000000')).toBe('abcdef');
  });

  it('ensures animation speeds fall within visually accessible bounds to avoid flashing', () => {
    expect(sanitizeSpeed('1s', '8s')).toBe('8s');
    expect(sanitizeSpeed('25s', '8s')).toBe('8s');
    expect(sanitizeSpeed('5s', '8s')).toBe('5s');
  });

  it('calculates color luminance accurately for WCAG contrast ratio compliance', () => {
    expect(getLuminance('ffffff')).toBeCloseTo(1, 1);
    expect(getLuminance('000000')).toBeCloseTo(0, 1);
  });

  it('safely escapes characters to prevent breaking screen reader <desc> or aria-label markup', () => {
    const maliciousLabel = 'Label with <script> & "quotes"';
    const escaped = escapeXML(maliciousLabel);

    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&quot;quotes&quot;');
  });

  it('sanitizes external font URLs to prevent stylesheet injection that breaks text readability', () => {
    expect(sanitizeGoogleFontUrl('Roboto')).toBe('Roboto');
    expect(sanitizeGoogleFontUrl('Open Sans')).toBe('Open+Sans');
    expect(sanitizeGoogleFontUrl('invalid font name!@#')).toBeNull();
  });
});
