/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { generateOptimizedSvg } from './svgRenderer';

describe('src/utils/svgRenderer — Edge Cases & Empty/Missing Inputs Verification', () => {
  // 1. Empty Input Handling
  it('should handle empty array input without throwing and return a valid fallback SVG wrapper', () => {
    let result: string | undefined;
    expect(() => {
      result = generateOptimizedSvg([]);
    }).not.toThrow();

    expect(result).toBeDefined();
    expect(result).toContain('<svg');
    expect(result).toContain('id="monolith-grid"');
    // Ensure no grid tile elements are instantiated
    expect(result).not.toContain('<g transform="translate(');
    expect(result).not.toContain('<use href="#iso-top"');
  });

  // 2. Null & Undefined Input Handling
  it('should handle null, undefined, empty object, and malformed node inputs gracefully without runtime exceptions', () => {
    // Test direct null/undefined/empty object inputs
    let nullResult: string | undefined;
    let undefinedResult: string | undefined;
    let emptyObjectResult: string | undefined;

    expect(() => {
      nullResult = generateOptimizedSvg(null as any);
    }).not.toThrow();

    expect(() => {
      undefinedResult = generateOptimizedSvg(undefined as any);
    }).not.toThrow();

    expect(() => {
      emptyObjectResult = generateOptimizedSvg({} as any);
    }).not.toThrow();

    expect(nullResult).toContain('<svg');
    expect(undefinedResult).toContain('<svg');
    expect(emptyObjectResult).toContain('<svg');

    // Test malformed node objects (missing x, y, count, or containing nulls)
    const malformedData = [
      null as any,
      undefined as any,
      {} as any,
      { date: '2026-01-01' } as any, // missing x, y, count
      { date: '2026-01-02', x: 'invalid', y: 0, count: 5 } as any, // non-numeric x
      { date: '2026-01-03', x: 1, y: null, count: 10 } as any, // null y
      { date: '2026-01-04', x: 2, y: 2, count: undefined } as any, // missing count (should default to 0)
    ];

    let malformedResult: string | undefined;
    expect(() => {
      malformedResult = generateOptimizedSvg(malformedData);
    }).not.toThrow();

    expect(malformedResult).toContain('<svg');
    // Only the node with x=2, y=2, count=undefined should be processed as count=0 (flat ground base footprint vector)
    expect(malformedResult).toContain('x="0" y="16" fill="#1e293b" opacity="0.2"');
    // Ensure towers are not drawn since count is fallback 0
    expect(malformedResult).not.toContain('<g transform="translate(');
  });

  // 3. Default Layout & Styling
  it('should confirm default SVG attributes, viewbox, dimensions, and defs stylesheets remain intact', () => {
    const result = generateOptimizedSvg([]);

    // Check SVG tag attributes
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(result).toContain('viewBox="-200 -50 800 600"');
    expect(result).toContain('width="100%"');
    expect(result).toContain('height="100%"');

    // Verify required master blueprints (<defs>) exist
    expect(result).toContain('id="iso-top"');
    expect(result).toContain('id="iso-left-unit"');
    expect(result).toContain('id="iso-right-unit"');
    expect(result).toContain('id="left-shading"');
    expect(result).toContain('id="right-shading"');
  });

  // 4. Hydration & Runtime Stability
  it('should verify deterministic output across repeated renders and browser environment stability', () => {
    const render1 = generateOptimizedSvg([]);
    const render2 = generateOptimizedSvg([]);

    // Test determinism (critical for SSR and hydration stability)
    expect(render1).toBe(render2);

    // Verify loading and manipulation in JS DOM environment
    const container = document.createElement('div');
    expect(() => {
      container.innerHTML = render1;
    }).not.toThrow();

    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toBeNull();
    expect(svgElement?.getAttribute('viewBox')).toBe('-200 -50 800 600');

    // Re-rendering or replacing shouldn't trigger browser engine issues
    expect(() => {
      container.innerHTML = render2;
    }).not.toThrow();
  });

  // 5. Empty DOM/SVG Marker Validation
  it('should validate standard DOM hierarchy and verify the monolith-grid group is empty', () => {
    const result = generateOptimizedSvg([]);
    const container = document.createElement('div');
    container.innerHTML = result;

    const monolithGrid = container.querySelector('#monolith-grid');
    expect(monolithGrid).not.toBeNull();

    // The monolith-grid should not contain any child element tags (no tiles or towers rendered)
    expect(monolithGrid?.children.length).toBe(0);
  });
});
