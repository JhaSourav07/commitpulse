import { describe, it, expect } from 'vitest';
import { generateOptimizedSvg, ContributionNode } from './svgRenderer';

describe('svgRenderer - Edge Cases & Empty/Missing Inputs', () => {
  // Scenario 1: Empty Input Handling
  it('should render safely with empty arrays/objects and not throw', () => {
    // Empty array
    expect(() => generateOptimizedSvg([])).not.toThrow();
    const svgEmptyArray = generateOptimizedSvg([]);
    expect(svgEmptyArray).toContain('<svg');
    expect(svgEmptyArray).toContain('id="monolith-grid"');

    // Array containing empty objects/invalid shapes
    expect(() => generateOptimizedSvg([{} as unknown as ContributionNode])).not.toThrow();
    const svgEmptyObj = generateOptimizedSvg([{} as unknown as ContributionNode]);
    expect(svgEmptyObj).toContain('<svg');
    expect(svgEmptyObj).toContain('id="monolith-grid"');
  });

  // Scenario 2: Null & Undefined Input Handling
  it('should render safely with null, undefined, or missing optional parameters', () => {
    // Null input
    expect(() => generateOptimizedSvg(null as unknown as ContributionNode[])).not.toThrow();
    const svgNull = generateOptimizedSvg(null as unknown as ContributionNode[]);
    expect(svgNull).toContain('<svg');
    expect(svgNull).toContain('id="monolith-grid"');

    // Undefined input
    expect(() => generateOptimizedSvg(undefined as unknown as ContributionNode[])).not.toThrow();
    const svgUndefined = generateOptimizedSvg(undefined as unknown as ContributionNode[]);
    expect(svgUndefined).toContain('<svg');
    expect(svgUndefined).toContain('id="monolith-grid"');

    // Missing arguments entirely (runtime Javascript fallback check)
    expect(() => (generateOptimizedSvg as unknown as () => string)()).not.toThrow();
    const svgNoArgs = (generateOptimizedSvg as unknown as () => string)();
    expect(svgNoArgs).toContain('<svg');
    expect(svgNoArgs).toContain('id="monolith-grid"');
  });

  // Scenario 3: Default Layout & Styling
  it('should preserve default layout structure, dimensions, and styling under empty/fallback inputs', () => {
    const svg = generateOptimizedSvg([]);

    // Check wrapper SVG structural attributes
    expect(svg).toContain('viewBox="-200 -50 800 600"');
    expect(svg).toContain('width="100%"');
    expect(svg).toContain('height="100%"');

    // Check essential layout structures and gradient definition mappings
    expect(svg).toContain('linearGradient id="left-shading"');
    expect(svg).toContain('linearGradient id="right-shading"');
    expect(svg).toContain('polygon id="iso-top"');
  });

  // Scenario 4: Hydration & Runtime Stability
  it('should remain stable and deterministic under repeated rendering with empty data', () => {
    const renders = Array.from({ length: 50 }, () => generateOptimizedSvg([]));
    const firstRender = renders[0];

    // Ensure all renders produce identical, deterministic output (no random IDs/timestamps or state leaks)
    for (const render of renders) {
      expect(render).toBe(firstRender);
    }
  });

  // Scenario 5: Empty DOM/SVG Marker Validation
  it('should render critical SVG structural elements and semantic markers', () => {
    const svg = generateOptimizedSvg([]);

    // Document boundary checks
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);

    // Root accessibility markers must exist
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="svg-title svg-desc"');

    // Inner structural nodes must be rendered
    expect(svg).toContain('<title id="svg-title">GitHub Contribution Graph</title>');
    expect(svg).toContain(
      '<desc id="svg-desc">A 3D isometric visualization of GitHub contribution activity.</desc>'
    );
    expect(svg).toContain('<g id="monolith-grid">');
  });
});
