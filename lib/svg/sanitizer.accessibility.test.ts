import { describe, it, expect } from 'vitest';
import {
  sanitizeHexColor,
  sanitizeFont,
  sanitizeRadius,
  isValidHex,
  sanitizeGoogleFontUrl,
} from './sanitizer';

describe('Accessibility Standards & Screen Reader Aria Compliance', () => {
  describe('role and aria-labelledby attribute value preservation', () => {
    it('preserves a valid hex color used as a fill in a role="img" SVG element', () => {
      // SVG: <svg role="img" aria-labelledby="title"><rect fill="#4a90e2" /></svg>
      // The fill value passes through sanitizeHexColor — it must come out intact
      expect(sanitizeHexColor('4a90e2', '000000')).toBe('4a90e2');
    });

    it('preserves accent color used in aria-labelledby-referenced title element', () => {
      // SVG: <title id="chart-title" fill="#58a6ff">Contribution chart</title>
      expect(sanitizeHexColor('58a6ff', '000000')).toBe('58a6ff');
    });

    it('returns fallback and does not propagate injection into aria attribute values', () => {
      // Malicious input that would break aria-labelledby="<injected>" in SVG markup
      expect(sanitizeHexColor('"><svg onload=alert(1)', '000000')).toBe('000000');
      expect(sanitizeHexColor("' aria-hidden='true", '000000')).toBe('000000');
    });
  });

  describe('aria-describedby attribute value preservation', () => {
    it('preserves font name used in an aria-describedby-referenced desc element', () => {
      // SVG: <desc id="chart-desc" font-family="Space Grotesk">...</desc>
      // font-family value is sanitized — it must survive intact for screen reader announcements
      expect(sanitizeFont('Space Grotesk')).toBe('Space Grotesk');
      expect(sanitizeFont('Roboto Mono')).toBe('Roboto Mono');
    });

    it('strips characters from font names that would break out of SVG desc attribute markup', () => {
      // font-family="Inter"onload=alert(1)" — the quote breaks the attribute
      expect(sanitizeFont('Inter"')).toBe('Inter');
      expect(sanitizeFont('Fira Code')).toBe('Fira Code');
    });

    it('returns null for font values that would produce an empty desc element', () => {
      // An empty desc gives screen readers nothing to read
      expect(sanitizeFont('')).toBeNull();
      expect(sanitizeFont('   ')).toBeNull();
      expect(sanitizeFont(null)).toBeNull();
    });
  });

  describe('title element — accessible name preservation', () => {
    it('preserves valid hex color used in SVG title element fill attributes', () => {
      // SVG: <title fill="#ffffff">CommitPulse streak chart</title>
      expect(sanitizeHexColor('ffffff', '000000')).toBe('ffffff');
      expect(sanitizeHexColor('#ffffff', '000000')).toBe('ffffff');
    });

    it('preserves short-form hex colors used in accessible title styling', () => {
      // Short hex is valid in SVG fill: fill="#fff"
      expect(sanitizeHexColor('fff', '000000')).toBe('fff');
      expect(sanitizeHexColor('#fff', '000000')).toBe('fff');
    });

    it('confirms that valid hex values used in title elements pass isValidHex check', () => {
      // Only colors passing isValidHex should appear in accessible title markup
      expect(isValidHex('c9d1d9')).toBe(true);
      expect(isValidHex('0d1117')).toBe(true);
      expect(isValidHex('not-a-color')).toBe(false);
    });
  });

  describe('desc element — accessible description font preservation', () => {
    it('encodes font name for Google Fonts URL used in SVG @import for desc element styling', () => {
      // SVG uses @import url(https://fonts.googleapis.com/css?family=Open+Sans)
      // This URL is embedded in the SVG and referenced by desc elements
      expect(sanitizeGoogleFontUrl('Open Sans')).toBe('Open+Sans');
      expect(sanitizeGoogleFontUrl('Roboto')).toBe('Roboto');
    });

    it('returns null for font URLs containing injection patterns in desc element context', () => {
      // Prevents @import url(javascript:...) or similar in SVG style blocks
      expect(sanitizeGoogleFontUrl('Open Sans; @import url(evil.com)')).toBeNull();
      expect(sanitizeGoogleFontUrl('<script>')).toBeNull();
      expect(sanitizeGoogleFontUrl("Roboto'")).toBeNull();
    });

    it('returns null for empty font values that would produce broken desc element styling', () => {
      expect(sanitizeGoogleFontUrl('')).toBeNull();
      expect(sanitizeGoogleFontUrl(null)).toBeNull();
      expect(sanitizeGoogleFontUrl(undefined)).toBeNull();
    });
  });

  describe('keyboard-navigable element shape — focusable SVG node radius', () => {
    it('preserves valid radius for SVG rect elements used as focusable interactive nodes', () => {
      // SVG: <rect role="button" tabindex="0" rx="8" ry="8" />
      // rx/ry come from sanitizeRadius — must be exact for focus ring to render correctly
      expect(sanitizeRadius(8, 8)).toBe(8);
      expect(sanitizeRadius('12', 8)).toBe(12);
      expect(sanitizeRadius(0, 8)).toBe(0);
    });

    it('clamps out-of-range radius so focusable SVG nodes always have a renderable shape', () => {
      expect(sanitizeRadius(-1, 8)).toBe(0);
      expect(sanitizeRadius(100, 8)).toBe(50);
    });

    it('returns fallback radius for invalid values so focusable SVG nodes are never shapeless', () => {
      expect(sanitizeRadius('invalid', 8)).toBe(8);
      expect(sanitizeRadius(null, 8)).toBe(8);
      expect(sanitizeRadius(undefined, 8)).toBe(8);
    });
  });
});
