import { describe, it, expect } from 'vitest';
import {
  isValidHex,
  hexColor,
  sanitizeHexColor,
  sanitizeSpeed,
  sanitizeRadius,
  sanitizeFont,
  sanitizeGoogleFontUrl,
  parseGradientStops,
  MAX_GRADIENT_STOPS,
  sanitizeCustomText,
} from './sanitizer';

describe('SVG Sanitizer Utilities', () => {
  describe('isValidHex', () => {
    it('returns true for valid 6-digit hex', () => {
      expect(isValidHex('ffffff')).toBe(true);
      expect(isValidHex('#ffffff')).toBe(true);
    });

    it('returns true for valid 3-digit hex', () => {
      expect(isValidHex('abc')).toBe(true);
      expect(isValidHex('#abc')).toBe(true);
    });

    it('returns true for valid 8-digit hex', () => {
      expect(isValidHex('ff00ff00')).toBe(true);
    });

    it('returns false for invalid characters', () => {
      expect(isValidHex('zzzzzz')).toBe(false);
      expect(isValidHex('ff00ff"')).toBe(false);
    });

    it('returns false for invalid length', () => {
      expect(isValidHex('f')).toBe(false);
      expect(isValidHex('ff')).toBe(false);
      expect(isValidHex('fffff')).toBe(false);
    });

    it('returns false for undefined, null, or empty string', () => {
      expect(isValidHex(undefined)).toBe(false);
      expect(isValidHex(null as unknown as string)).toBe(false);
      expect(isValidHex('')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isValidHex('')).toBe(false);
    });

    it('returns false for just a hash symbol', () => {
      expect(isValidHex('#')).toBe(false);
    });

    it('returns false for undefined input', () => {
      expect(isValidHex(undefined)).toBe(false);
    });

    it('returns false for invalid length (7 characters)', () => {
      expect(isValidHex('fffffff')).toBe(false);
    });
  });

  describe('hexColor', () => {
    it('returns hex without # for valid string without #', () => {
      expect(hexColor('ff0000')).toBe('ff0000');
    });

    it('strips # and returns valid hex', () => {
      expect(hexColor('#ff0000')).toBe('ff0000');
    });

    it('returns fallback for invalid string', () => {
      expect(hexColor('invalid', '000000')).toBe('000000');
    });

    it('returns default theme colors for invalid hex names', () => {
      expect(hexColor('not-a-background-color', '0d1117')).toBe('0d1117');
      expect(hexColor('not-a-text-color', 'c9d1d9')).toBe('c9d1d9');
      expect(hexColor('not-an-accent-color', '58a6ff')).toBe('58a6ff');
    });

    it('strips # from fallback theme colors when invalid hex names are provided', () => {
      expect(hexColor('not-a-theme-color', '#0d1117')).toBe('0d1117');
      expect(hexColor('invalid-text-color', '#c9d1d9')).toBe('c9d1d9');
      expect(hexColor('invalid-accent-color', '#58a6ff')).toBe('58a6ff');
    });

    it('returns default fallback for empty string', () => {
      expect(hexColor('')).toBe('000000');
    });

    it('applies standard gray fallback for unrecognized hex strings', () => {
      expect(hexColor('ZZZZZZ', '808080')).toBe('808080');
      expect(hexColor('GGGGGG', '808080')).toBe('808080');
      expect(hexColor('xyz999', '808080')).toBe('808080');
      expect(hexColor('------', '808080')).toBe('808080');
    });

    it('applies standard gray fallback for mixed invalid hex patterns', () => {
      expect(hexColor('12ZZ34', '808080')).toBe('808080');
      expect(hexColor('#XXYYZZ', '808080')).toBe('808080');
      expect(hexColor('abc!23', '808080')).toBe('808080');
      expect(hexColor('12345?', '808080')).toBe('808080');
    });
  });

  describe('sanitizeHexColor', () => {
    it('returns sanitized hex without #', () => {
      expect(sanitizeHexColor('#ff00ff', '000000')).toBe('ff00ff');
      expect(sanitizeHexColor('ff00ff', '000000')).toBe('ff00ff');
      expect(sanitizeHexColor('##ff00ff', '000000')).toBe('ff00ff');
    });

    it('returns valid 3-digit hex without #', () => {
      expect(sanitizeHexColor('#f0f', '000000')).toBe('f0f');
      expect(sanitizeHexColor('f0f', '000000')).toBe('f0f');
      expect(sanitizeHexColor('##f0f', '000000')).toBe('f0f');
    });

    it('returns valid 8-digit hex without #', () => {
      expect(sanitizeHexColor('#ff00ff00', '000000')).toBe('ff00ff00');
      expect(sanitizeHexColor('ff00ff00', '000000')).toBe('ff00ff00');
      expect(sanitizeHexColor('##ff00ff00', '000000')).toBe('ff00ff00');
    });

    it('returns valid 4-digit hex without #', () => {
      expect(sanitizeHexColor('#f0f0', '000000')).toBe('f0f0');
      expect(sanitizeHexColor('f0f0', '000000')).toBe('f0f0');
      expect(sanitizeHexColor('##f0f0', '000000')).toBe('f0f0');
    });

    it('returns fallback for invalid input', () => {
      expect(sanitizeHexColor('invalid', '000000')).toBe('000000');
      expect(sanitizeHexColor('"><script>', '000000')).toBe('000000');
    });

    it('uses fallback color for unrecognized hex strings', () => {
      expect(sanitizeHexColor('not-a-color', '808080')).toBe('808080');
      expect(sanitizeHexColor('xyz123', '808080')).toBe('808080');
    });

    it('returns fallback for invalid hex names', () => {
      expect(sanitizeHexColor('red', '000000')).toBe('000000');
      expect(sanitizeHexColor('blue', '000000')).toBe('000000');
      expect(sanitizeHexColor('green', '000000')).toBe('000000');
    });

    it('returns fallback for null/undefined', () => {
      expect(sanitizeHexColor(null, '000000')).toBe('000000');
      expect(sanitizeHexColor(undefined, '000000')).toBe('000000');
    });

    it('uses drop-shadow glow color fallback for unrecognized hex strings in SVG filters', () => {
      expect(sanitizeHexColor('invalid-accent', '00ffaa')).toBe('00ffaa');
      expect(sanitizeHexColor('not-a-glow', '00ffaa')).toBe('00ffaa');
      expect(sanitizeHexColor('xyz123abc', '00ffaa')).toBe('00ffaa');
    });
  });

  describe('sanitizeSpeed', () => {
    it('returns valid speed strings within 2s-20s range', () => {
      expect(sanitizeSpeed('8s', '5s')).toBe('8s');
      expect(sanitizeSpeed('2s', '5s')).toBe('2s');
      expect(sanitizeSpeed('20s', '5s')).toBe('20s');
    });

    it('accepts decimal speed values within valid range', () => {
      expect(sanitizeSpeed('8.0s', '5s')).toBe('8.0s');
      expect(sanitizeSpeed('2.0s', '5s')).toBe('2.0s');
      expect(sanitizeSpeed('20.0s', '5s')).toBe('20.0s');
      expect(sanitizeSpeed('2.1s', '5s')).toBe('2.1s');
    });

    it('returns fallback for speed outside 2s-20s range', () => {
      expect(sanitizeSpeed('1.5s', '5s')).toBe('5s');
      expect(sanitizeSpeed('21s', '5s')).toBe('5s');
    });

    it('returns fallback for invalid speed format', () => {
      expect(sanitizeSpeed('fast', '8s')).toBe('8s');
      expect(sanitizeSpeed('8', '8s')).toBe('8s');
      expect(sanitizeSpeed('s', '8s')).toBe('8s');
    });

    it('returns fallback for null or undefined speed', () => {
      expect(sanitizeSpeed(undefined, '8s')).toBe('8s');
      expect(sanitizeSpeed(null, '8s')).toBe('8s');
    });
  });

  describe('sanitizeRadius', () => {
    it('returns valid numbers', () => {
      expect(sanitizeRadius('10', 8)).toBe(10);
      expect(sanitizeRadius(20, 8)).toBe(20);
    });

    it('clamps values between 0 and 50', () => {
      expect(sanitizeRadius('-10', 8)).toBe(0);
      expect(sanitizeRadius('100', 8)).toBe(50);
    });

    it('returns fallback for invalid input', () => {
      expect(sanitizeRadius('invalid', 8)).toBe(8);
    });

    it('handles float strings, extreme negative values, leading zeros, and boundaries', () => {
      expect(sanitizeRadius('8.7', 8)).toBe(8);
      expect(sanitizeRadius('-999', 8)).toBe(0);
      expect(sanitizeRadius('50', 8)).toBe(50);
      expect(sanitizeRadius('51', 8)).toBe(50);
      expect(sanitizeRadius('00', 8)).toBe(0);
    });

    it('returns fallback for null or undefined input', () => {
      expect(sanitizeRadius(undefined, 8)).toBe(8);
      expect(sanitizeRadius(null, 8)).toBe(8);
    });
  });

  describe('sanitizeFont', () => {
    it('removes unsafe characters', () => {
      expect(sanitizeFont('Inter"')).toBe('Inter');
      expect(sanitizeFont('Open Sans"')).toBe('Open Sans');
    });

    it('returns null for completely invalid font', () => {
      expect(sanitizeFont('!!!')).toBe(null);
    });

    it('returns null for null input', () => {
      expect(sanitizeFont(null)).toBe(null);
    });

    it('returns null for whitespace-only input', () => {
      expect(sanitizeFont('   ')).toBe(null);
    });

    it('preserves valid font names with spaces', () => {
      expect(sanitizeFont('Fira Code')).toBe('Fira Code');
    });

    it('allows numeric font names', () => {
      expect(sanitizeFont('123')).toBe('123');
    });

    it('sanitizes script injection attempts', () => {
      expect(sanitizeFont('<script>alert(1)</script>')).toBe('scriptalert1script');
    });

    it('returns null when sanitization removes all characters', () => {
      expect(sanitizeFont('@@@')).toBe(null);
    });
  });

  describe('sanitizeGoogleFontUrl', () => {
    it('handles normal font names and spaces', () => {
      expect(sanitizeGoogleFontUrl('Roboto')).toBe('Roboto');
      expect(sanitizeGoogleFontUrl('Open Sans')).toBe('Open+Sans');
      expect(sanitizeGoogleFontUrl('Space-Grotesk')).toBe('Space-Grotesk');
      expect(sanitizeGoogleFontUrl('  PT Sans  ')).toBe('PT+Sans');
    });

    it('returns null for empty strings, null, and undefined', () => {
      expect(sanitizeGoogleFontUrl('')).toBe(null);
      expect(sanitizeGoogleFontUrl('   ')).toBe(null);
      expect(sanitizeGoogleFontUrl(null)).toBe(null);
      expect(sanitizeGoogleFontUrl(undefined)).toBe(null);
    });

    it('returns null for malicious or injection inputs', () => {
      expect(sanitizeGoogleFontUrl("Open Sans'")).toBe(null);
      expect(sanitizeGoogleFontUrl('Open Sans"')).toBe(null);
      expect(sanitizeGoogleFontUrl('Open Sans;')).toBe(null);
      expect(sanitizeGoogleFontUrl('Open Sans/')).toBe(null);
      expect(sanitizeGoogleFontUrl('Open Sans\\')).toBe(null);
      expect(sanitizeGoogleFontUrl('<script>')).toBe(null);
      expect(sanitizeGoogleFontUrl('Open Sans); @import url(http://evil.com)')).toBe(null);
      expect(sanitizeGoogleFontUrl('../invalid')).toBe(null);
      expect(sanitizeGoogleFontUrl('https://example.com')).toBe(null);
    });
  });

  describe('theme color parsing fallbacks', () => {
    it('resolves invalid hex names to default dark theme background color', () => {
      expect(hexColor('not-a-background-color', '0d1117')).toBe('0d1117');
      expect(hexColor('background', '0d1117')).toBe('0d1117');
      expect(hexColor('', '0d1117')).toBe('0d1117');
    });

    it('resolves invalid hex names to default dark theme text color', () => {
      expect(hexColor('not-a-text-color', 'c9d1d9')).toBe('c9d1d9');
      expect(hexColor('text', 'c9d1d9')).toBe('c9d1d9');
      expect(hexColor('invalid-text', 'c9d1d9')).toBe('c9d1d9');
    });

    it('resolves invalid hex names to default dark theme accent color', () => {
      expect(hexColor('not-an-accent-color', '58a6ff')).toBe('58a6ff');
      expect(hexColor('accent', '58a6ff')).toBe('58a6ff');
      expect(hexColor('highlight', '58a6ff')).toBe('58a6ff');
    });

    it('resolves invalid hex names to light theme colors', () => {
      expect(hexColor('not-a-color', 'ffffff')).toBe('ffffff');
      expect(hexColor('not-a-color', '24292f')).toBe('24292f');
      expect(hexColor('not-a-color', '0969da')).toBe('0969da');
    });

    it('still resolves valid hex correctly even with theme-like fallbacks', () => {
      expect(hexColor('0d1117', '000000')).toBe('0d1117');
      expect(hexColor('c9d1d9', '000000')).toBe('c9d1d9');
      expect(hexColor('58a6ff', '000000')).toBe('58a6ff');
    });
  });
});

describe('parseGradientStops', () => {
  it('returns empty array for undefined input', () => {
    expect(parseGradientStops(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseGradientStops('')).toEqual([]);
  });

  it('parses valid hex colors without # prefix', () => {
    expect(parseGradientStops('ff6b35,7000ff')).toEqual(['ff6b35', '7000ff']);
  });

  it('parses valid hex colors with # prefix and strips it', () => {
    expect(parseGradientStops('#ff6b35,#7000ff')).toEqual(['ff6b35', '7000ff']);
  });

  it('filters out invalid hex tokens and keeps valid ones', () => {
    expect(parseGradientStops('ff6b35,invalid,7000ff')).toEqual(['ff6b35', '7000ff']);
  });

  it('returns empty array when all tokens are invalid', () => {
    expect(parseGradientStops('invalid,colors,here')).toEqual([]);
  });

  it('returns a single valid color', () => {
    expect(parseGradientStops('ff6b35')).toEqual(['ff6b35']);
  });

  it(`caps output at MAX_GRADIENT_STOPS (${MAX_GRADIENT_STOPS}) entries`, () => {
    // Build a string with MAX_GRADIENT_STOPS + 5 valid colors
    const allColors = Array.from({ length: MAX_GRADIENT_STOPS + 5 }, (_, i) =>
      i.toString(16).padStart(6, '0')
    );
    const input = allColors.join(',');
    const result = parseGradientStops(input);
    expect(result.length).toBe(MAX_GRADIENT_STOPS);
    // Only the first MAX_GRADIENT_STOPS tokens should appear
    expect(result).toEqual(allColors.slice(0, MAX_GRADIENT_STOPS));
  });

  it('does not error on a massive comma-separated string beyond MAX_GRADIENT_STOPS', () => {
    const massive = Array.from({ length: 1000 }, () => 'ff0000').join(',');
    const result = parseGradientStops(massive);
    expect(result.length).toBeLessThanOrEqual(MAX_GRADIENT_STOPS);
  });

  it('handles mixed valid/invalid colors when list is larger than cap', () => {
    // 12 valid colors — should be capped at MAX_GRADIENT_STOPS
    const colors = Array.from({ length: 12 }, () => 'aabbcc').join(',');
    const result = parseGradientStops(colors);
    expect(result.length).toBe(MAX_GRADIENT_STOPS);
  });
});

describe('sanitizeCustomText', () => {
  it('escapes XML reserved characters', () => {
    expect(sanitizeCustomText('hello & welcome <here>')).toBe('hello &amp; welcome &lt;here&gt;');
    expect(sanitizeCustomText('"" onclick="alert(1)"')).toBe(
      '&quot;&quot; onclick=&quot;alert(1)&quot;'
    );
  });

  it('returns empty string for undefined or null or empty input', () => {
    expect(sanitizeCustomText(undefined)).toBe('');
    expect(sanitizeCustomText(null)).toBe('');
    expect(sanitizeCustomText('')).toBe('');
  });
});
