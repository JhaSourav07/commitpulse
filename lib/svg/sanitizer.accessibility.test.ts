import { describe, it, expect } from 'vitest';
import {
  sanitizeFont,
  sanitizeGoogleFontUrl,
  sanitizeHexColor,
  sanitizeRadius,
  getGradientCoordinates,
} from './sanitizer';

/**
 * Accessibility Standards & Screen Reader Aria Compliance
 *
 * Tests verify that sanitizer outputs are safe for embedding in
 * accessible SVG attributes (role, aria-*, title, desc) and that
 * the sanitizer preserves accessibility-related SVG content correctly.
 */

describe('sanitizer-accessibility', () => {
  it('verify Accessibility Standards & Screen Reader Aria Compliance (Variation 1): sanitizeFont preserves valid font names safe for use in SVG title and desc elements announced by screen readers', () => {
    // SVG <title> and <desc> elements are the primary mechanism for
    // screen reader announcements. Font names embedded in SVG style
    // blocks must be clean so they do not corrupt the surrounding
    // accessible markup.
    expect(sanitizeFont('Open Sans')).toBe('Open Sans');
    expect(sanitizeFont('Roboto')).toBe('Roboto');
    expect(sanitizeFont('Noto Sans')).toBe('Noto Sans');
    // Injection attempts that could break aria-label attribute boundaries
    // must be stripped — the sanitizer must return only safe content
    expect(sanitizeFont('Arial<desc>injected</desc>')).toBe('Arialdescinjecteddesc');
    expect(sanitizeFont(null)).toBeNull();
  });

  it('verify Accessibility Standards & Screen Reader Aria Compliance (Variation 2): sanitizeHexColor output is safe for SVG fill attributes on role="img" elements without corrupting accessible color contrast metadata', () => {
    // SVG elements with role="img" use fill/stroke for visual presentation.
    // Screen readers rely on these elements having valid, non-injected
    // attribute values. A corrupted fill could hide the element from
    // both sighted users and assistive technologies.
    const safeColor = sanitizeHexColor('1a73e8', '000000');
    expect(safeColor).toBe('1a73e8');
    // Verify the output contains only hex characters — safe for SVG attributes
    expect(/^[0-9a-fA-F]{3,8}$/.test(safeColor)).toBe(true);

    // Injection attempts must fall back to the safe default
    const injected = sanitizeHexColor('fff; fill:url(evil)', '000000');
    expect(injected).toBe('000000');
    expect(/^[0-9a-fA-F]{3,8}$/.test(injected)).toBe(true);
  });

  it('verify Accessibility Standards & Screen Reader Aria Compliance (Variation 3): getGradientCoordinates returns well-formed SVG linearGradient coordinate attributes preserving accessible SVG structure', () => {
    // SVG linearGradient elements referenced by accessible fills must
    // have well-formed x1/y1/x2/y2 attributes. Malformed coordinates
    // break SVG DOM parsing and cause screen readers to fail to
    // announce the containing role="img" element correctly.
    const coords = getGradientCoordinates('vertical');
    // Each coordinate must be a valid percentage string
    expect(coords.x1).toMatch(/^\d+%$/);
    expect(coords.y1).toMatch(/^\d+%$/);
    expect(coords.x2).toMatch(/^\d+%$/);
    expect(coords.y2).toMatch(/^\d+%$/);

    // Invalid direction must fall back to a valid default — screen
    // readers must always receive a parseable SVG structure
    const fallback = getGradientCoordinates('invalid-aria-direction');
    expect(fallback).toEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  });

  it('verify Accessibility Standards & Screen Reader Aria Compliance (Variation 4): sanitizeGoogleFontUrl produces output safe for use in SVG @font-face src attributes without injecting content into aria-describedby references', () => {
    // SVG @font-face declarations appear in <defs> elements that may
    // be referenced by aria-describedby. An injected font URL could
    // load external resources or break the SVG defs structure,
    // corrupting screen reader description references.
    const safe = sanitizeGoogleFontUrl('Roboto Mono');
    expect(safe).toBe('Roboto+Mono');
    // Output must only contain URL-safe characters
    expect(safe).toMatch(/^[a-zA-Z0-9+\-]+$/);

    // Injection attempts must return null — no unsafe content reaches SVG
    expect(sanitizeGoogleFontUrl('Font</desc><script>alert(1)</script>')).toBeNull();
    expect(sanitizeGoogleFontUrl('url(javascript:evil)')).toBeNull();
    expect(sanitizeGoogleFontUrl(null)).toBeNull();
  });

  it('verify Accessibility Standards & Screen Reader Aria Compliance (Variation 5): sanitizeRadius ensures SVG rect rx attributes stay within bounds that maintain visible focus indicators for keyboard navigation compliance', () => {
    // WCAG 2.4.7 requires visible keyboard focus indicators. SVG rect
    // elements use rx for rounded corners on focus rings. An extreme
    // radius collapses the visible shape; sanitizeRadius must clamp
    // values so the focus indicator always remains visible.
    expect(sanitizeRadius(8)).toBe(8); // standard border radius
    expect(sanitizeRadius(0)).toBe(0); // square — still visible
    expect(sanitizeRadius(50)).toBe(50); // max allowed — still renders
    expect(sanitizeRadius(999)).toBe(50); // clamped — prevents invisible pill
    expect(sanitizeRadius(-1)).toBe(0); // clamped — prevents negative rx
    expect(sanitizeRadius('16')).toBe(16); // string input parsed correctly
    expect(sanitizeRadius(null)).toBe(8); // null falls back to safe default
  });
});
