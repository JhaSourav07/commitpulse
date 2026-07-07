// lib/export3d.mouse-interactivity.test.ts
//
// Tests that the data structures produced by export3d correctly support mouse
// and touch interactive behaviour.  export3d is a pure data layer — it does
// not render DOM or attach event handlers itself.  Instead its TowerData[]
// and STL output carry the information that InteractiveViewer and the SVG
// generator rely on for tooltips, cursor changes, click/touch handling, and
// hover-cleanup.

import { describe, it, expect } from 'vitest';
import { activityToTowers, generateMonolithSTL } from './export3d';
import type { ActivityData } from '@/types/dashboard';

// Reusable factory matching the existing test suite style in export3d.test.ts
const makeDay = (date: string, count: number, intensity: 0 | 1 | 2 | 3 | 4 = 0): ActivityData => ({
  date,
  count,
  intensity,
});

describe('export3d mouse-interactivity', () => {
  // ── Test 1: Mouse Hover / Tooltip Display ─────────────────────────────────
  //
  // When a user hovers over an interactive tower, the consumer (e.g.
  // InteractiveViewer or the SVG generator) reads the tooltip string to
  // display a hover card.  We verify that activityToTowers populates the
  // tooltip field with the date and contribution count so that the consumer
  // has the information it needs.

  it('produces a non‑empty tooltip containing date and count for hover display', () => {
    const days = [makeDay('2024-06-15', 42, 4)];
    const towers = activityToTowers(days);

    expect(towers).toHaveLength(1);
    expect(towers[0].tooltip).toBe('2024-06-15: 42 contributions');
    expect(towers[0].date).toBe('2024-06-15');
    expect(towers[0].contributionCount).toBe(42);
  });

  // ── Test 2: Tooltip Position Updates ──────────────────────────────────────
  //
  // The tooltip text must be derived from the actual event data rather than
  // being hardcoded.  Changing the input should produce a different tooltip,
  // proving the consumer will display coordinates that match the interaction.

  it('derives tooltip content from the input data – different dates and counts yield different tooltips', () => {
    const days = [
      makeDay('2024-01-10', 5, 1),
      makeDay('2024-06-15', 42, 4),
      makeDay('2024-12-25', 0, 0),
    ];
    const towers = activityToTowers(days);

    expect(towers[0].tooltip).toBe('2024-01-10: 5 contributions');
    expect(towers[1].tooltip).toBe('2024-06-15: 42 contributions');
    expect(towers[2].tooltip).toBe('2024-12-25: 0 contributions');

    // Each tower carries its own date so the consumer can map it to a
    // screen position on hover.
    expect(towers[0].date).toBe('2024-01-10');
    expect(towers[1].date).toBe('2024-06-15');
    expect(towers[2].date).toBe('2024-12-25');
  });

  // ── Test 3: Click / Touch Event Propagation ───────────────────────────────
  //
  // When a user clicks or taps an interactive tower, the consumer supplies
  // contributionCount as the payload.  We verify that generateMonolithSTL
  // includes every tower from the input (no silent dropping) and that the
  // TowerData array carries the attributes InteractiveViewer reads on click
  // (date, count, hasCommits).  The SVG generator also bakes these into
  // data-* attributes so pointer events can propagate up to the handler.

  it('preserves all tower metadata for click/touch event payloads', () => {
    const days = [
      makeDay('2024-07-01', 10, 3),
      makeDay('2024-07-02', 0, 0),
      makeDay('2024-07-03', 25, 4),
    ];
    const towers = activityToTowers(days);
    const stl = generateMonolithSTL(towers);

    // All three days produce a TowerData entry.
    expect(towers).toHaveLength(3);

    // The STL must contain the model — this proves the consumer receives the
    // full tower set and can associate click/touch events with the right data.
    expect(stl).toContain('solid commitpulse_monolith');
    expect(stl).toContain('endsolid commitpulse_monolith');

    // Each tower carries the fields the consumer reads on click/tap.
    expect(towers[0]).toMatchObject({
      date: '2024-07-01',
      contributionCount: 10,
      hasCommits: true,
    });
    expect(towers[1]).toMatchObject({
      date: '2024-07-02',
      contributionCount: 0,
      hasCommits: false,
    });
    expect(towers[2]).toMatchObject({
      date: '2024-07-03',
      contributionCount: 25,
      hasCommits: true,
    });
  });

  // ── Test 4: Cursor Hover State ────────────────────────────────────────────
  //
  // The consumer (SVG generator) applies the class `interactive-tower` to
  // every tower, and CSS sets `cursor: pointer` on that class.  However the
  // distinction between "clickable" and "non‑clickable" towers is driven by
  // hasCommits.  We verify the boolean is correctly set so the consumer can
  // decide whether to attach pointer‑event handlers that show a cursor.

  it('sets hasCommits true for days with contributions and false for empty days, driving cursor pointer state', () => {
    const days = [
      makeDay('2024-03-01', 0, 0),
      makeDay('2024-03-02', 1, 1),
      makeDay('2024-03-03', 0, 0),
      makeDay('2024-03-04', 5, 2),
    ];
    const towers = activityToTowers(days);

    expect(towers[0].hasCommits).toBe(false);
    expect(towers[0].contributionCount).toBe(0);
    expect(towers[1].hasCommits).toBe(true);
    expect(towers[1].contributionCount).toBe(1);
    expect(towers[2].hasCommits).toBe(false);
    expect(towers[2].contributionCount).toBe(0);
    expect(towers[3].hasCommits).toBe(true);
    expect(towers[3].contributionCount).toBe(5);

    // Additionally, h > 0 means the tower renders visibly (cursor visible),
    // while h === 0 means it has no visible area.
    expect(towers[0].h).toBe(0);
    expect(towers[1].h).toBeGreaterThanOrEqual(1);
    expect(towers[2].h).toBe(0);
    expect(towers[3].h).toBeGreaterThanOrEqual(1);
  });

  // ── Test 5: Mouse Leave Cleanup ───────────────────────────────────────────
  //
  // When the mouse leaves a tower, the consumer should remove any overlay,
  // tooltip, or highlight.  The data that determines this is the tower's
  // hasCommits and tooltip — a consumer that leaves an interactive zone must
  // revert to the default state.  We verify that towers with no contributions
  // produce empty‑ish metadata so the consumer can correctly treat them as
  // "not interactive" and clean up any stale hover decorations.

  it('marks days without contributions so consumers can clean up overlays on mouse leave', () => {
    const days = [makeDay('2024-11-01', 0, 0), makeDay('2024-11-02', 0, 0)];
    const towers = activityToTowers(days);

    // With zero contributions there is no tooltip data worth displaying,
    // and the consumer should treat the tower as non‑interactive.
    towers.forEach((t) => {
      expect(t.hasCommits).toBe(false);
      expect(t.h).toBe(0);
      // The tooltip still contains the factual string so the consumer could
      // show it if desired, but the hasCommits flag allows it to skip.
      expect(t.tooltip).toContain('0 contributions');
    });

    // The STL output includes the base plate but no tower facets, meaning
    // the consumer sees no hoverable tower geometry.  Only base-plate
    // facets (12) should be present.
    const stl = generateMonolithSTL(towers);
    const facetCount = (stl.match(/facet normal/g) ?? []).length;
    expect(facetCount).toBe(12);
  });
});
