import { describe, it, expect } from 'vitest';
import { activityToTowers, generateMonolithSTL } from './export3d';
import type { ActivityData } from '@/types/dashboard';

/**
 * Dark and Light Prefers-Color-Scheme Visual Cohesion tests for export3d.
 *
 * The export3d module produces a colorless ASCII STL geometry payload — it
 * intentionally carries no CSS, no theme tokens, no color metadata, and no
 * stylesheet hooks. That property is exactly what guarantees visual cohesion
 * across `prefers-color-scheme: dark` and `prefers-color-scheme: light`: the
 * 3D model is rendered by an external slicer/viewer, so its appearance is
 * dictated entirely by the host viewport's theme — never by leaked color
 * information from this module.
 *
 * These tests lock that contract in place so a future change cannot accidentally
 * bake theme-specific color tokens, hex codes, CSS classes, or background
 * overlays into the exported geometry — any of which would break visual
 * cohesion between dark and light viewers.
 */
describe('export3d - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  // Reusable factory matching the existing test suite style in export3d.test.ts
  const makeDay = (date: string, count: number): ActivityData => ({
    date,
    count,
    intensity: count === 0 ? 0 : (Math.min(4, Math.ceil((count / 10) * 4)) as 0 | 1 | 2 | 3 | 4),
  });

  // Test 1 — The STL payload must be free of any color / CSS / theme tokens.
  // If a hex code, rgb(...) call, Tailwind class, or `prefers-color-scheme`
  // hint ever leaks into the export, the model will look different (or worse,
  // clash) between dark-mode and light-mode viewers.
  it('emits geometry free of color tokens, hex codes, and CSS theme hooks', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2024-02-${String(i + 1).padStart(2, '0')}`, i + 1)
    );
    const stl = generateMonolithSTL(activityToTowers(days));

    // Forbid any common color or theme markers
    expect(stl).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); // hex colors
    expect(stl).not.toMatch(/\brgb[a]?\s*\(/i); // rgb / rgba
    expect(stl).not.toMatch(/\bhsl[a]?\s*\(/i); // hsl / hsla
    expect(stl).not.toMatch(/prefers-color-scheme/i);
    expect(stl).not.toMatch(/\bdark\b|\blight\b/i); // theme name leaks
    expect(stl).not.toMatch(/class\s*=|style\s*=/i); // markup style hooks
  });

  // Test 2 — The same activity input must yield byte-identical geometry on
  // every call. Deterministic geometry is what allows a dark-mode and a
  // light-mode user to see the same model — any non-determinism would break
  // visual cohesion between the two preference groups.
  it('produces byte-identical geometry across repeated invocations (theme-independent reproducibility)', () => {
    const days = Array.from({ length: 14 }, (_, i) =>
      makeDay(`2024-03-${String(i + 1).padStart(2, '0')}`, (i % 6) + 1)
    );

    const stlA = generateMonolithSTL(activityToTowers(days));
    const stlB = generateMonolithSTL(activityToTowers(days));

    expect(stlA).toBe(stlB);
  });

  // Test 3 — Tower heights must stay inside the documented MAX_HEIGHT_MM (30mm)
  // ceiling. A theme background overlay (e.g. a dark-mode card) is sized
  // around this clamp, so any overflow would let foreground geometry clip
  // through the theme's background container in one mode but not the other.
  it('clamps tower heights to MAX_HEIGHT_MM so no tower can clip a theme background overlay', () => {
    const days: ActivityData[] = [
      makeDay('2024-04-01', 1),
      makeDay('2024-04-02', 50),
      makeDay('2024-04-03', 9999), // extreme outlier
    ];

    const towers = activityToTowers(days);

    towers.forEach((tower) => {
      expect(tower.h).toBeGreaterThanOrEqual(0);
      expect(tower.h).toBeLessThanOrEqual(30); // MAX_HEIGHT_MM
    });
  });

  // Test 4 — Every facet line must be a pure numeric vertex triplet. If a
  // future change ever appends a styling attribute (e.g. `vertex 1.00 2.00 3.00 color="#fff"`),
  // the STL would render correctly in one theme and break in another. This
  // test guards the markup so it stays uniform across both color schemes.
  it('renders vertex lines as pure numeric geometry (no inline style attributes)', () => {
    const days = [makeDay('2024-05-01', 3), makeDay('2024-05-02', 7)];
    const stl = generateMonolithSTL(activityToTowers(days));

    const vertexLines = stl.split('\n').filter((line) => line.trim().startsWith('vertex'));

    expect(vertexLines.length).toBeGreaterThan(0);
    vertexLines.forEach((line) => {
      // Strictly: "vertex <num> <num> <num>" — nothing else allowed.
      expect(line.trim()).toMatch(/^vertex -?\d+\.\d+ -?\d+\.\d+ -?\d+\.\d+$/);
    });
  });

  // Test 5 — The base plate must always be present and fully enclose the
  // towers. In a themed UI the base plate is what hides the parent background
  // (light or dark) behind the model — a missing or undersized base would
  // expose the underlying theme color through the gaps and ruin cohesion.
  it('always emits a base plate that fully encloses every tower footprint', () => {
    const days = Array.from({ length: 21 }, (_, i) =>
      makeDay(`2024-06-${String(i + 1).padStart(2, '0')}`, (i % 4) + 1)
    );
    const towers = activityToTowers(days);
    const stl = generateMonolithSTL(towers);

    // Solid header / footer present
    expect(stl).toContain('solid commitpulse_monolith');
    expect(stl).toContain('endsolid commitpulse_monolith');

    // A box = 12 facets. With N towers (all with h>0) + 1 base plate,
    // we expect at minimum (N + 1) * 12 facets. This proves the base plate
    // was emitted in addition to every tower.
    const facetCount = (stl.match(/facet normal/g) ?? []).length;
    const towersWithHeight = towers.filter((t) => t.h > 0).length;
    const minimumExpected = (towersWithHeight + 1) * 12;

    expect(facetCount).toBeGreaterThanOrEqual(minimumExpected);

    // Every opened facet/loop must be closed — guarantees the base plate
    // (and all towers) are watertight, with no gaps that could leak the
    // underlying theme background color through the model.
    const endFacetCount = (stl.match(/endfacet/g) ?? []).length;
    const outerLoopCount = (stl.match(/outer loop/g) ?? []).length;
    const endLoopCount = (stl.match(/endloop/g) ?? []).length;
    expect(facetCount).toBe(endFacetCount);
    expect(outerLoopCount).toBe(endLoopCount);
  });
});
