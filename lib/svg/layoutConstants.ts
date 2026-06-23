export const GHOST_HEIGHT_PX = 4;
export const LOG_SCALE_MULTIPLIER = 15;
export const LINEAR_SCALE_MULTIPLIER = 5;
export const MAX_LOG_HEIGHT = 50;
export const MAX_LINEAR_HEIGHT = 50;

// ── Isometric grid coordinate constants ──────────────────────────────────────
// These define the 3D isometric projection math shared between layout.ts
// (tower positioning via projectIsometric) and generator.ts (label positioning
// via renderIsometricLabels). Single source of truth prevents drift between
// tower and label coordinates — previously TILE_HEIGHT_HALF was 10 in layout.ts
// and 9 in generator.ts, causing label misalignment on ?labels=true badges.

/** X coordinate of the isometric grid origin (center column, top row). */
export const GRID_ORIGIN_X = 300;

/** Y coordinate of the isometric grid origin (center column, top row). */
export const GRID_ORIGIN_Y = 120;

/** Half the width of a single isometric tile in pixels. */
export const TILE_WIDTH_HALF = 16;

/**
 * Half the height of a single isometric tile in pixels.
 * Must match the value used in projectIsometric() and renderIsometricLabels().
 * Value is 10 — matches the original projectIsometric() formula.
 * Previously generator.ts incorrectly used 9, causing label drift.
 */
export const TILE_HEIGHT_HALF = 10;
